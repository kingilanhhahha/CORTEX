"""Shared rational equation solution analysis utilities.

This module adapts the interactive checker logic from ``step.py`` so it can be
consumed by web APIs or other automated callers.  The goal is to reproduce the
same reasoning that the CLI prints while returning fully structured,
JSON-serialisable data.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, Iterable, List, Optional

import sympy as sp

from step import (  # type: ignore
    analyze_verification_context,
    contains_text_or_symbols,
    get_detailed_verification_analysis,
    get_verification_examples,
    get_verification_feedback,
    insert_multiplication_signs,
    normalize_math_expression,
)


@dataclass
class StudentDetectionFlags:
    mentions_denominators: bool = False
    mentions_restrictions: bool = False
    mentions_lcd: bool = False
    shows_simplified_equation: bool = False
    mentions_verification: bool = False
    shows_verification_work: bool = False


@dataclass
class PreprocessingSummary:
    lhs: str
    rhs: str
    denominators: List[str] = field(default_factory=list)
    restrictions: List[str] = field(default_factory=list)
    lcd: Optional[str] = None
    simplified_lhs: Optional[str] = None
    simplified_rhs: Optional[str] = None


@dataclass
class EvaluationSummary:
    answer_correct: bool
    student_value: Optional[str]
    actual_solutions: List[str]
    extraneous_solutions: List[str]


def _stringify(value: Any) -> str:
    """Convert SymPy objects (or anything else) into friendly strings."""

    if isinstance(value, (list, tuple, set)):
        return ", ".join(_stringify(v) for v in value)
    try:
        return sp.sstr(value)
    except Exception:
        return str(value)


def _normalize_solution_lines(lines: Iterable[str]) -> List[str]:
    normalized: List[str] = []
    for raw in lines:
        if raw is None:
            continue
        raw_str = str(raw).strip()
        if not raw_str:
            continue
        normalized.append(raw_str)
    return normalized


def _convert_student_answer(answer: str) -> str:
    if answer is None:
        return ""
    return str(answer).strip()


def _parse_student_value(answer: str, equations: List[str]) -> Optional[sp.Expr]:
    """Best effort to interpret the student's declared solution value."""

    clean_answer = answer.replace("X", "x").strip()
    if clean_answer.startswith("x = "):
        clean_answer = clean_answer[4:]
    elif clean_answer.startswith("x="):
        clean_answer = clean_answer[2:]

    try_candidates = [clean_answer]

    if "±" in clean_answer:
        try_candidates.extend(
            [clean_answer.replace("±", sign) for sign in ("+", "-")]
        )

    for candidate in try_candidates:
        try:
            normalized = normalize_math_expression(candidate)
            if not normalized:
                continue
            return sp.sympify(normalized)
        except Exception:
            continue

    # Fall back to scanning the provided equations/text
    for line in equations:
        lower = line.lower()
        if "x =" in lower or "x=" in lower:
            math_part = line.split("=", 1)[1].strip()
            try:
                normalized = normalize_math_expression(math_part)
                if not normalized:
                    continue
                return sp.sympify(normalized)
            except Exception:
                continue

    return None


def analyze_student_solution(
    original_equation: str,
    student_answer: str,
    student_solution_lines: Iterable[str],
) -> Dict[str, Any]:
    """Perform a full rational-equation solution analysis.

    Parameters
    ----------
    original_equation:
        The instructor-provided equation as a string.
    student_answer:
        The student's declared final answer (e.g., ``"x = 3"``).
    student_solution_lines:
        Iterable of line-by-line work shown by the student.

    Returns
    -------
    dict
        JSON-safe dictionary describing preprocessing, detection flags,
        parsed equations, correctness, and remediation steps.  On failure the
        dictionary contains ``{"status": "error", "error": ...}``.
    """

    # Ensure we are working with trimmed lists/strings
    student_lines = _normalize_solution_lines(student_solution_lines)
    student_answer = _convert_student_answer(student_answer)

    cleaned_equation = (original_equation or "").replace("X", "x").strip()

    # Attempt to sanitise OCR/LaTeX artifacts using the shared OCR pipeline
    try:
        # Use unified normalizer when available
        import lcd  # type: ignore
        cleaned_equation = lcd.to_checker_equation(cleaned_equation)
    except Exception:
        # Safe to ignore; we still attempt our own normalisation next
        pass

    cleaned_equation = insert_multiplication_signs(cleaned_equation)

    if not cleaned_equation:
        return {
            "status": "error",
            "error": "Original equation is required.",
        }

    # Fallbacks to recover an equation string if OCR left LaTeX or oddities
    if "=" not in cleaned_equation:
        # Common OCR slip: comma instead of equals
        if "," in cleaned_equation:
            cleaned_equation = cleaned_equation.replace(",", "=")
        # Try LaTeX → SymPy Equality → string lhs=rhs
        if "=" not in cleaned_equation:
            try:
                import lcd  # type: ignore
                maybe_expr = lcd.latex_to_sympy_via_latex2sympy(cleaned_equation)
                from sympy import Equality
                if isinstance(maybe_expr, Equality):
                    cleaned_equation = f"{str(maybe_expr.lhs)}={str(maybe_expr.rhs)}"
            except Exception:
                pass
        if "=" not in cleaned_equation:
            return {
                "status": "error",
                "error": "Original equation must contain an '=' sign.",
            }

    try:
        lhs_str, rhs_str = cleaned_equation.split("=", 1)
        lhs, rhs = map(sp.sympify, [lhs_str, rhs_str])
    except Exception as exc:
        return {
            "status": "error",
            "error": f"Unable to parse equation: {exc}",
        }

    preprocessing = PreprocessingSummary(lhs=_stringify(lhs), rhs=_stringify(rhs))
    detection = StudentDetectionFlags()

    denominators: List[sp.Expr] = []
    restrictions: List[sp.Expr] = []

    try:
        for expr in (lhs, rhs):
            if expr.is_Add:
                iterable = expr.args
            else:
                iterable = (expr,)
            for component in iterable:
                num, den = sp.fraction(sp.together(component))
                if den != 1:
                    denominators.append(den)
                    try:
                        restrictions.extend(sp.solve(den, sp.symbols("x")))
                    except Exception:
                        continue
    except Exception as exc:
        return {
            "status": "error",
            "error": f"Failed while extracting denominators: {exc}",
        }

    # De-duplicate and normalise outputs
    denominators_simplified: List[sp.Expr] = []
    for den in denominators:
        try:
            simplified_den = sp.simplify(den)
        except Exception:
            simplified_den = den
        if simplified_den == 1:
            continue
        if all(not sp.simplify(simplified_den - existing) == 0 for existing in denominators_simplified):
            denominators_simplified.append(simplified_den)

    preprocessing.denominators = [_stringify(d) for d in denominators_simplified]

    unique_restrictions: List[sp.Expr] = []
    for res in restrictions:
        if any(sp.simplify(res - existing) == 0 for existing in unique_restrictions):
            continue
        unique_restrictions.append(sp.simplify(res))
    preprocessing.restrictions = [_stringify(r) for r in unique_restrictions]

    if denominators_simplified:
        try:
            lcd_expr = sp.lcm([sp.factor(d) for d in denominators_simplified])
            preprocessing.lcd = _stringify(sp.factor(lcd_expr))
        except Exception:
            preprocessing.lcd = _stringify(sp.Integer(1))
            lcd_expr = sp.Integer(1)
    else:
        lcd_expr = sp.Integer(1)
        preprocessing.lcd = _stringify(lcd_expr)

    try:
        simplified_lhs = sp.expand(sp.simplify(lhs * lcd_expr))
        simplified_rhs = sp.expand(sp.simplify(rhs * lcd_expr))
        preprocessing.simplified_lhs = _stringify(simplified_lhs)
        preprocessing.simplified_rhs = _stringify(simplified_rhs)
    except Exception:
        simplified_lhs = lhs
        simplified_rhs = rhs
        preprocessing.simplified_lhs = _stringify(lhs)
        preprocessing.simplified_rhs = _stringify(rhs)

    # Student detection flags
    verification_keywords = [
        "verify",
        "verification",
        "check",
        "substitute",
        "substitution",
        "test",
        "testing",
        "plug in",
        "plugging in",
        "lhs",
        "rhs",
        "left side",
        "right side",
        "both sides",
        "balance",
        "balanced",
    ]

    for idx, line in enumerate(student_lines):
        lower = line.lower()
        if any(word in lower for word in [
            "denominator",
            "denominators",
            "denom",
            "lcd",
            "least common denominator",
        ]):
            detection.mentions_denominators = True
        if any(word in lower for word in [
            "restriction",
            "restrictions",
            "excluded",
            "cannot",
            "≠",
            "!=",
            "not equal",
            "not equal to",
            "undefined",
            "domain",
            "not allowed",
        ]):
            detection.mentions_restrictions = True
        if any(word in lower for word in [
            "multiply both sides by",
            "multiply by",
            "times",
        ]):
            detection.mentions_lcd = True
        if (
            "=" in line
            and not any(char in line for char in ["/", "÷"])
            and any(char in line for char in ["x", "X"])
            and len(line) > 5
        ):
            detection.shows_simplified_equation = True

        if any(keyword in lower for keyword in verification_keywords):
            detection.mentions_verification = True

        if not detection.shows_verification_work:
            if (
                any(char in line for char in ["=", "≈", "≠"])
                and any(char in line for char in ["x", "X"])
                and any(char.isdigit() for char in line)
                and any(word in lower for word in ["check", "verify", "test", "substitute", "lhs", "rhs"])
            ):
                detection.shows_verification_work = True

        if not detection.shows_verification_work and ("x =" in lower or "x=" in lower):
            if idx + 1 < len(student_lines):
                next_line_lower = student_lines[idx + 1].lower()
                if any(word in next_line_lower for word in [
                    "check",
                    "verify",
                    "test",
                    "substitute",
                    "lhs",
                    "rhs",
                    "left",
                    "right",
                ]):
                    detection.shows_verification_work = True

        if not detection.shows_verification_work and "/" in line and any(char.isdigit() for char in line) and any(char in line for char in ["=", "≈", "≠"]):
            if any(word in lower for word in ["check", "verify", "test", "substitute"]):
                detection.shows_verification_work = True

        if not detection.shows_verification_work and any(phrase in lower for phrase in [
            "lhs =",
            "rhs =",
            "left side =",
            "right side =",
            "left=",
            "right=",
        ]):
            detection.shows_verification_work = True

        if not detection.shows_verification_work and ("when x =" in lower or ("x =" in lower and ":" in line)):
            if any(char in line for char in ["(", ")", "/"]) and any(char.isdigit() for char in line):
                detection.shows_verification_work = True

        if not detection.shows_verification_work and any(word in lower for word in ["check:", "verify:", "test:"]):
            if idx + 1 < len(student_lines):
                next_line = student_lines[idx + 1]
                if any(char in next_line for char in ["=", "/", "(", ")"]) and any(char.isdigit() for char in next_line):
                    detection.shows_verification_work = True

        if not detection.shows_verification_work and "/" in line and any(char in line for char in ["=", "≈", "≠"]):
            for prev_idx in range(max(0, idx - 3), idx):
                prev_line = student_lines[prev_idx]
                if ("x =" in prev_line or "x=" in prev_line) and any(char.isdigit() for char in prev_line):
                    detection.shows_verification_work = True
                    break

        if not detection.shows_verification_work and "/" in line and "=" in line:
            if any(char in line for char in ["+", "-"]) and "/" in line:
                for prev_idx in range(max(0, idx - 3), idx):
                    prev_line = student_lines[prev_idx]
                    if ("x =" in prev_line or "x=" in prev_line) and any(char.isdigit() for char in prev_line):
                        detection.shows_verification_work = True
                        break

    if denominators_simplified and not detection.mentions_denominators:
        for line in student_lines:
            stripped = line.replace(" ", "")
            for den in denominators_simplified:
                if _stringify(den).replace(" ", "") in stripped:
                    detection.mentions_denominators = True
                    break
            if detection.mentions_denominators:
                break

    if denominators_simplified and not detection.mentions_lcd:
        for line in student_lines:
            for den in denominators_simplified:
                den_str = _stringify(den)
                if den_str in line and ("*" in line or "multiply" in line.lower()):
                    detection.mentions_lcd = True
                    break
            if detection.mentions_lcd:
                break

    normalized_solution = [normalize_math_expression(line) for line in student_lines]

    student_equations: List[str] = []
    student_text: List[str] = []
    for line in normalized_solution:
        stripped = line.strip()
        if not stripped:
            continue
        if "=" in stripped:
            student_equations.append(stripped)
        elif any(
            char in stripped
            for char in "+-*/÷()xX²^±√"
        ) and len(stripped) > 2:
            student_equations.append(stripped)
        elif contains_text_or_symbols(stripped):
            student_text.append(stripped)
        elif any(ch.isdigit() for ch in stripped) and len(stripped) > 3:
            student_equations.append(stripped)
        else:
            student_text.append(stripped)

    if not student_equations and not student_text and student_answer:
        student_equations.append(student_answer)

    student_value = None
    try:
        student_value = _parse_student_value(student_answer, student_equations + student_text)
    except Exception:
        student_value = None

    answer_correct = False
    extraneous: List[sp.Expr] = []
    actual_solutions: List[sp.Expr] = []

    try:
        standard_form = sp.expand(simplified_lhs - simplified_rhs)
        actual_solutions = sp.solve(standard_form, sp.symbols("x"))
        if student_value is not None:
            for sol in actual_solutions:
                try:
                    if abs(sp.N(student_value - sol, 8)) < 1e-8:
                        answer_correct = True
                        break
                except Exception:
                    continue
    except Exception:
        standard_form = None

    if denominators_simplified:
        for sol in actual_solutions:
            for den in denominators_simplified:
                try:
                    if sp.simplify(den.subs(sp.symbols("x"), sol)) == 0:
                        extraneous.append(sol)
                        break
                except Exception:
                    continue

    evaluation = EvaluationSummary(
        answer_correct=answer_correct,
        student_value=_stringify(student_value) if student_value is not None else None,
        actual_solutions=[_stringify(sol) for sol in actual_solutions],
        extraneous_solutions=[_stringify(sol) for sol in extraneous],
    )

    feedback: List[str] = []
    if evaluation.answer_correct:
        feedback.append("Great job! The final answer is correct.")
    else:
        feedback.append("Student answer is incorrect – review the guided steps below.")

    if denominators_simplified and not detection.mentions_denominators:
        feedback.append("Remind the student to list each denominator explicitly before clearing fractions.")

    if preprocessing.restrictions and not detection.mentions_restrictions:
        feedback.append("Ask the student to state the domain restrictions (values that make denominators zero).")

    if (
        denominators_simplified
        and preprocessing.lcd
        and preprocessing.lcd != "1"
        and not detection.mentions_lcd
    ):
        feedback.append("Encourage the student to indicate that they are multiplying by the LCD and why that step is valid.")

    if not detection.shows_simplified_equation:
        feedback.append("Prompt the student to display the simplified equation after clearing denominators.")

    if not student_lines:
        feedback.append("No written work detected – request the complete solution steps in addition to the final answer.")

    verification_score, verification_details = analyze_verification_context(student_lines, student_answer)
    verification_examples = get_verification_examples(cleaned_equation)
    detailed_verification = get_detailed_verification_analysis(student_lines, student_answer)

    effective_verification = detection.mentions_verification or detection.shows_verification_work
    verification_feedback = get_verification_feedback(effective_verification, detection.shows_verification_work)

    # Merge verification-specific feedback while preventing duplicate advice
    for note in verification_feedback:
        if note not in feedback:
            feedback.append(note)

    # Add detailed verification substitution steps
    verification_steps = []
    if evaluation.actual_solutions:
        for solution in evaluation.actual_solutions:
            try:
                # Parse the solution value
                sol_value = float(solution) if '.' in solution else int(solution)
                
                # Show verification steps
                verification_steps.append(f"Check x={solution}:")
                
                # Calculate left side step by step
                verification_steps.append("Left side:")
                try:
                    # Substitute x into the original equation's left side
                    lhs_substituted = preprocessing.lhs.subs('x', sol_value)
                    verification_steps.append(f"  {preprocessing.lhs} → {lhs_substituted}")
                    
                    # Simplify step by step
                    lhs_simplified = sp.simplify(lhs_substituted)
                    verification_steps.append(f"  → {lhs_simplified}")
                    
                    # Final result
                    lhs_final = float(lhs_simplified) if lhs_simplified.is_number else lhs_simplified
                    verification_steps.append(f"  → {lhs_final}")
                    
                except Exception as e:
                    verification_steps.append(f"  Error calculating LHS: {e}")
                
                # Calculate right side step by step
                verification_steps.append("Right side:")
                try:
                    # Substitute x into the original equation's right side
                    rhs_substituted = preprocessing.rhs.subs('x', sol_value)
                    verification_steps.append(f"  {preprocessing.rhs} → {rhs_substituted}")
                    
                    # Simplify step by step
                    rhs_simplified = sp.simplify(rhs_substituted)
                    verification_steps.append(f"  → {rhs_simplified}")
                    
                    # Final result
                    rhs_final = float(rhs_simplified) if rhs_simplified.is_number else rhs_simplified
                    verification_steps.append(f"  → {rhs_final}")
                    
                except Exception as e:
                    verification_steps.append(f"  Error calculating RHS: {e}")
                
                # Check if valid
                try:
                    lhs_val = float(lhs_final) if lhs_final.is_number else lhs_final
                    rhs_val = float(rhs_final) if rhs_final.is_number else rhs_final
                    if lhs_val == rhs_val:
                        verification_steps.append("VALID ✅")
                    else:
                        verification_steps.append("INVALID ❌")
                except:
                    verification_steps.append("Cannot verify")
                
                verification_steps.append("")
                
            except Exception as e:
                verification_steps.append(f"Error verifying solution {solution}: {e}")

    verification_summary = {
        "mentions_verification": detection.mentions_verification,
        "shows_verification_work": detection.shows_verification_work,
        "score": verification_score,
        "details": verification_details,
        "feedback": verification_feedback,
        "examples": verification_examples,
        "analysis": detailed_verification,
        "steps": verification_steps,
    }

    step_by_step: List[str] = []
    if not answer_correct:
        step_by_step.extend(
            [
                "📝 Step 1: Original equation",
                f"   {preprocessing.lhs} = {preprocessing.rhs}",
            ]
        )

        if preprocessing.restrictions:
            step_by_step.append("📝 Step 2: Restrictions")
            step_by_step.append(
                "   x ≠ " + ", ".join(preprocessing.restrictions)
            )
        else:
            step_by_step.append("📝 Step 2: Restrictions")
            step_by_step.append("   None (no variable denominators)")

        if preprocessing.lcd and preprocessing.lcd != "1":
            step_by_step.append("📝 Step 3: Multiply both sides by LCD")
            step_by_step.append(f"   LCD = {preprocessing.lcd}")
            step_by_step.append(
                f"   {preprocessing.lcd} × ({preprocessing.lhs}) = {preprocessing.lcd} × ({preprocessing.rhs})"
            )
        else:
            step_by_step.append("📝 Step 3: No denominators to clear")

        if preprocessing.simplified_lhs and preprocessing.simplified_rhs:
            step_by_step.append("📝 Step 4: Simplified equation")
            step_by_step.append(
                f"   {preprocessing.simplified_lhs} = {preprocessing.simplified_rhs}"
            )

        if standard_form is not None:
            step_by_step.append("📝 Step 5: Solve for x")
            step_by_step.append(
                f"   {preprocessing.simplified_lhs} - {preprocessing.simplified_rhs} = 0"
            )
            step_by_step.append(f"   {_stringify(standard_form)} = 0")

        if evaluation.actual_solutions:
            step_by_step.append("📝 Step 6: Solutions")
            step_by_step.append(
                "   x = " + ", ".join(evaluation.actual_solutions)
            )

    return {
        "status": "ok",
        "input": {
            "original_equation": cleaned_equation,
            "student_answer": student_answer,
            "student_solution_lines": student_lines,
        },
        "preprocessing": {
            "lhs": preprocessing.lhs,
            "rhs": preprocessing.rhs,
            "denominators": preprocessing.denominators,
            "restrictions": preprocessing.restrictions,
            "lcd": preprocessing.lcd,
            "simplified_lhs": preprocessing.simplified_lhs,
            "simplified_rhs": preprocessing.simplified_rhs,
        },
        "student_detection": {
            "mentions_denominators": detection.mentions_denominators,
            "mentions_restrictions": detection.mentions_restrictions,
            "mentions_lcd": detection.mentions_lcd,
            "shows_simplified_equation": detection.shows_simplified_equation,
            "mentions_verification": detection.mentions_verification,
            "shows_verification_work": detection.shows_verification_work,
        },
        "parsed_solution": {
            "normalized_lines": normalized_solution,
            "equations": student_equations,
            "notes": student_text,
        },
        "evaluation": {
            "answer_correct": evaluation.answer_correct,
            "student_value": evaluation.student_value,
            "actual_solutions": evaluation.actual_solutions,
            "extraneous_solutions": evaluation.extraneous_solutions,
        },
        "verification": verification_summary,
        "feedback": feedback,
        "step_by_step": step_by_step,
    }


