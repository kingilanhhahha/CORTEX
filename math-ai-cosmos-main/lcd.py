"""
math_ocr_pipeline.py
Headless pipeline (image path mode) with robust LaTeX cleaning and handling
of latex2sympy2 list outputs.

Replace SIMPLETEX_UAT with your UAT token.
"""
import re
import sys
import requests
import sympy as sp
from latex2sympy2 import latex2sympy
from sympy import Eq
try:
    from typing import Optional, Any
except ImportError:
    # Fallback for older Python versions
    Optional = None
    Any = object

# =========================
# CONFIG - replace token & image path
# =========================
SIMPLETEX_UAT = "mOha3P9qrzXqWTbl5DosMWNQZXU9f0hhD80HXJ1O1uew77n43VT2pOys3Afw6s2n"
SIMPLETEX_API_URL = "https://server.simpletex.net/api/latex_ocr"
IMAGE_PATH = "taena.png"

# =========================
# Helper functions
# =========================
def send_to_simpletex(image_path, token, api_url=SIMPLETEX_API_URL, timeout=20):
    headers = {"token": token}
    with open(image_path, "rb") as f:
        files = {"file": ("image.png", f, "image/png")}
        try:
            resp = requests.post(api_url, headers=headers, files=files, timeout=timeout)
            resp.raise_for_status()
        except requests.RequestException as e:
            raise RuntimeError(f"SimpleTex request failed: {e}") from e

    try:
        res_json = resp.json()
    except ValueError as e:
        raise RuntimeError("Invalid JSON returned from SimpleTex.") from e

    if not res_json.get("status"):
        raise RuntimeError(f"SimpleTex returned error: {res_json}")

    latex = res_json["res"].get("latex")
    if not latex:
        raise RuntimeError("No 'latex' field returned by SimpleTex.")
    return latex

def clean_ocr_artifacts(latex: str) -> str:
    """
    Remove common OCR / SimpleTex artifacts that break parsing:
    - drop content after TeX linebreaks (\\)
    - remove bracketed repeats like [ ... ]
    - strip newlines and excessive whitespace
    This is conservative: keeps the earliest equation-like content.
    """
    if not isinstance(latex, str):
        return latex
    s = latex
    # If input contains TeX linebreak "\\", keep text before first occurrence
    if r'\\' in s:
        s = s.split(r'\\', 1)[0]
    # Remove square-bracketed blocks (often redundant OCR echoes)
    s = re.sub(r'\[.*?\]', '', s)
    # Remove stray line breaks and multiple spaces
    s = s.replace('\n', ' ').replace('\r', ' ')
    s = re.sub(r'\s+', ' ', s).strip()
    return s

def preprocess_latex_for_rationals(latex: str) -> str:
    """
    Normalization to make latex2sympy2 happier.
    """
    if not isinstance(latex, str):
        return latex

    s = latex.strip()
    # clean obvious OCR artifacts first
    s = clean_ocr_artifacts(s)

    # remove surrounding $ ... $
    if s.startswith("$$") and s.endswith("$$"):
        s = s[2:-2].strip()
    elif s.startswith("$") and s.endswith("$"):
        s = s[1:-1].strip()

    s = s.replace("\\dfrac", "\\frac").replace("\\tfrac", "\\frac")
    s = s.replace("−", "-")
    s = s.replace("\\times", "\\cdot")
    s = s.replace("\\,", "")
    s = s.replace("\\;", "")
    s = s.replace("\\!","")
    s = re.sub(r'[\u200B-\u200D\uFEFF\u00A0]', '', s)
    s = re.sub(r'\\frac\s*([^{\\\s]+)\s*([^{\\\s]+)', r'\\frac{\1}{\2}', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s

# ---- nested-fraction helpers (unchanged from earlier) ----
def _extract_braced(s: str, start_idx: int):
    if start_idx >= len(s) or s[start_idx] != '{':
        raise ValueError("extract_braced expects a '{' at start_idx")
    i = start_idx + 1
    depth = 1
    while i < len(s):
        ch = s[i]
        if ch == '{':
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0:
                return s[start_idx+1:i], i + 1
        i += 1
    raise ValueError("No matching closing '}' found")

def replace_nested_fracs(latex: str) -> str:
    s = latex
    while True:
        idx = s.find(r'\frac')
        if idx == -1:
            break
        i = idx + len(r'\frac')
        while i < len(s) and s[i].isspace():
            i += 1
        if i >= len(s) or s[i] != '{':
            break
        try:
            num, next_pos = _extract_braced(s, i)
        except ValueError:
            break
        j = next_pos
        while j < len(s) and s[j].isspace():
            j += 1
        if j >= len(s) or s[j] != '{':
            break
        try:
            den, after_den = _extract_braced(s, j)
        except ValueError:
            break
        replacement = f'({num})/({den})'
        s = s[:idx] + replacement + s[after_den:]
    return s
# ---- end nested fraction helpers ----

def fallback_latex_to_sympy_string(latex: str) -> str:
    s = latex.strip()
    if s.startswith("$$") and s.endswith("$$"):
        s = s[2:-2]
    elif s.startswith("$") and s.endswith("$"):
        s = s[1:-1]
    s = s.replace("\\cdot", "*").replace("\\times", "*")
    s = s.replace("\\,", "").replace("\\;", "").replace("\\!","")
    s = s.replace("\\left", "").replace("\\right", "")
    s = s.strip()

    # robust nested fractions
    try:
        s = replace_nested_fracs(s)
    except Exception:
        pass

    # remaining simple fraction pattern
    frac_pattern = re.compile(r'\\frac\s*{([^{}]+)}\s*{([^{}]+)}')
    while True:
        m = frac_pattern.search(s)
        if not m:
            break
        num = m.group(1); den = m.group(2)
        s = s[:m.start()] + f'({num})/({den})' + s[m.end():]

    s = re.sub(r'\\sqrt\{([^{}]+)\}', r'sqrt(\1)', s)
    s = re.sub(r'([A-Za-z0-9\)\]])\^\{([^{}]+)\}', r'\1**(\2)', s)
    s = re.sub(r'([A-Za-z0-9\)\]])\^([A-Za-z0-9])', r'\1**(\2)', s)
    s = s.replace("\\displaystyle", "").replace("$", "")
    s = re.sub(r'\s+', ' ', s).strip()
    s = re.sub(r'(\d|\w|\))\s*\(', r'\1*(', s)
    s = re.sub(r'\)\s*(\d|\w|\()', r')*\1', s)
    s = re.sub(r'(\d)\s*([A-Za-z])', r'\1*\2', s)
    s = s.replace(" ", "")
    return s

def format_solutions(sols: Any) -> str:
    """Friendly formatter for various solution output shapes."""
    if sols is None:
        return "No solutions"
    if isinstance(sols, dict) and "evaluated" in sols:
        return f"Evaluated: {sp.simplify(sols['evaluated'])}"
    # list of Eq objects (like latex2sympy2 output)
    if isinstance(sols, list):
        if all(isinstance(s, sp.Equality) for s in sols):
            return ", ".join(f"{sp.pretty(s.lhs)} = {sp.pretty(s.rhs)}" for s in sols)
        if all(isinstance(s, dict) for s in sols):
            items = []
            for d in sols:
                parts = [f"{sp.pretty(k)} = {sp.pretty(v)}" for k, v in d.items()]
                items.append("{" + ", ".join(parts) + "}")
            return ", ".join(items)
        return ", ".join(repr(s) for s in sols)
    if isinstance(sols, sp.Equality):
        return f"{sp.pretty(sols.lhs)} = {sp.pretty(sols.rhs)}"
    try:
        return sp.pretty(sols)
    except Exception:
        return repr(sols)

def latex_to_sympy_via_latex2sympy(latex: str) -> Any:
    """
    Try latex2sympy2 then fallback. Returns:
      - a SymPy expr (sp.Basic or sp.Equality), OR
      - a list (e.g. list of Eq(...) results from latex2sympy2) which will be interpreted as solutions.
    """
    if not isinstance(latex, str):
        raise RuntimeError("Expected LaTeX string input")

    latex_norm = preprocess_latex_for_rationals(latex)
    print("[DEBUG] LaTeX after preprocessing:", latex_norm)

    # if single '=' sign, try parsing both sides
    if '=' in latex_norm and latex_norm.count('=') == 1:
        lhs_raw, rhs_raw = latex_norm.split('=', 1)
        try:
            lhs_like = latex2sympy(lhs_raw)
            rhs_like = latex2sympy(rhs_raw)
            print("[DEBUG] latex2sympy2 lhs output:", repr(lhs_like))
            print("[DEBUG] latex2sympy2 rhs output:", repr(rhs_like))
            lhs = sp.sympify(lhs_like) if isinstance(lhs_like, str) else sp.sympify(str(lhs_like))
            rhs = sp.sympify(rhs_like) if isinstance(rhs_like, str) else sp.sympify(str(rhs_like))
            return Eq(lhs, rhs)
        except Exception as e:
            print("[DEBUG] primary latex2sympy2 equation path failed:", e)

    # primary attempt: full expression
    try:
        sympy_like = latex2sympy(latex_norm)
        print("[DEBUG] latex2sympy2 output:", repr(sympy_like))
        # If latex2sympy returned a list (common when it solves an equation and returns Eq-list), return it directly
        if isinstance(sympy_like, list):
            return sympy_like
        if sympy_like is None or (isinstance(sympy_like, str) and sympy_like.strip() == ""):
            raise RuntimeError("latex2sympy2 returned empty/None")
        expr = sp.sympify(sympy_like) if isinstance(sympy_like, str) else sp.sympify(str(sympy_like))
        return expr
    except Exception as e:
        print("[DEBUG] latex2sympy2 primary parse failed or sympify failed:", e)

    # fallback string converter
    fallback_str = fallback_latex_to_sympy_string(latex_norm)
    print("[DEBUG] Fallback sympy string:", fallback_str)
    try:
        expr = sp.sympify(fallback_str)
        print("[DEBUG] sympify succeeded on fallback string.")
        return expr
    except Exception as e:
        # final attempt if '=' present: parse LHS/RHS with fallback
        if '=' in latex_norm:
            try:
                lhs_raw, rhs_raw = latex_norm.split('=', 1)
                lhs_fb = fallback_latex_to_sympy_string(lhs_raw)
                rhs_fb = fallback_latex_to_sympy_string(rhs_raw)
                lhs = sp.sympify(lhs_fb)
                rhs = sp.sympify(rhs_fb)
                return Eq(lhs, rhs)
            except Exception as e2:
                print("[DEBUG] fallback equation attempt failed:", e2)
        raise RuntimeError(f"Unable to convert LaTeX to SymPy (primary and fallback failed). Last error: {e}") from e

def solve_sympy_expr(expr: sp.Expr):
    if expr is None:
        return None
    free_syms = list(expr.free_symbols)
    try:
        if isinstance(expr, sp.Equality) or isinstance(expr, Eq):
            syms = list(expr.free_symbols)
            if syms:
                sols = sp.solve(expr, syms[0], dict=True)
            else:
                sols = sp.solve(expr, dict=True)
        else:
            if free_syms:
                sols = sp.solve(sp.Eq(expr, 0), free_syms[0], dict=True)
            else:
                val = sp.simplify(expr)
                sols = {"evaluated": val}
    except Exception as e:
        raise RuntimeError(f"Error while solving expression: {e}") from e
    return sols

# =========================
# MAIN PIPELINE
# =========================
def main(image_path):
    # 1) Use existing image path
    img_path = image_path

    # 2) Send to SimpleTex and get LaTeX
    try:
        latex_raw = send_to_simpletex(img_path, SIMPLETEX_UAT)
        print("\n[SimpleTex] Raw LaTeX returned:\n", latex_raw)
    except Exception as e:
        print("Error calling SimpleTex API:", e)
        return

    # Save raw LaTeX to file
    try:
        with open("recognized_formula.tex", "w", encoding="utf-8") as outf:
            outf.write(latex_raw)
        print("Saved recognized LaTeX to recognized_formula.tex")
    except Exception:
        pass

    # 3) Convert LaTeX -> SymPy (or solutions-list)
    try:
        sympy_out = latex_to_sympy_via_latex2sympy(latex_raw)
        print("\n[latex2sympy2 -> sympy] Parsed output:")
        print(repr(sympy_out))
    except Exception as e:
        print("Failed to convert LaTeX to SymPy (latex2sympy2 + fallback):", e)
        return

    # If converter returned a list (e.g. list of Eq solutions), treat as solutions and print nicely
    if isinstance(sympy_out, list):
        print("\n[Detected] latex2sympy2 returned a list (likely solution set):")
        print(format_solutions(sympy_out))
        return

    # 4) No Matplotlib — just info
    print("[INFO] Matplotlib visualization removed. Skipping LaTeX rendering.")

    # 5) Solve expression (sympy_out is expected to be sp.Expr or sp.Equality)
    try:
        solutions = solve_sympy_expr(sympy_out)
        print("\n[Solve] Solutions or evaluation result:")
        print(format_solutions(solutions))
        try:
            pf = sp.apart(sympy_out) if not (isinstance(sympy_out, sp.Equality) or isinstance(sympy_out, Eq)) else None
            if pf is not None:
                print("\n[Analysis] partial fraction decomposition:")
                print(pf)
        except Exception:
            pass
    except Exception as e:
        print("Error while solving / evaluating SymPy expression:", e)
        return

    # 6) Pretty print
    try:
        print("\n[Pretty Print] SymPy pretty output:")
        sp.pprint(sympy_out)
    except Exception:
        pass

# =========================
# NEW WRAPPER FOR CALCULATOR USE
# =========================
def process_image(image_path: str) -> dict:
    """
    Wrapper around main() that returns structured results
    instead of just printing to console.
    Useful for integration into GUI or calculator systems.
    """
    result = {
        "latex_raw": None,
        "latex_clean": None,
        "equation": None,
        "sympy_out": None,
        "solutions": None,
        "pretty": None,
        "error": None,
        "debug_info": {}
    }
    
    try:
        print(f"[DEBUG] Processing image: {image_path}")
        
        # 1. Get raw LaTeX from SimpleTex
        try:
            latex_raw = send_to_simpletex(image_path, SIMPLETEX_UAT)
            result["latex_raw"] = latex_raw
            result["debug_info"]["simpletex_success"] = True
            print(f"[DEBUG] SimpleTex returned: {latex_raw}")
        except Exception as e:
            result["error"] = f"SimpleTex API failed: {str(e)}"
            result["debug_info"]["simpletex_success"] = False
            result["debug_info"]["simpletex_error"] = str(e)
            print(f"[DEBUG] SimpleTex failed: {e}")
            return result
        
        # 2. Clean and preprocess LaTeX
        try:
            latex_clean = clean_ocr_artifacts(latex_raw)
            latex_clean = preprocess_latex_for_rationals(latex_clean)
            result["latex_clean"] = latex_clean
            result["debug_info"]["latex_cleaning_success"] = True
            print(f"[DEBUG] Cleaned LaTeX: {latex_clean}")
        except Exception as e:
            result["error"] = f"LaTeX cleaning failed: {str(e)}"
            result["debug_info"]["latex_cleaning_success"] = False
            result["debug_info"]["latex_cleaning_error"] = str(e)
            print(f"[DEBUG] LaTeX cleaning failed: {e}")
            return result
        
        # 3. Convert to SymPy
        try:
            sympy_out = latex_to_sympy_via_latex2sympy(latex_clean)
            result["sympy_out"] = str(sympy_out)
            result["debug_info"]["sympy_conversion_success"] = True
            print(f"[DEBUG] SymPy conversion: {sympy_out}")
        except Exception as e:
            result["error"] = f"SymPy conversion failed: {str(e)}"
            result["debug_info"]["sympy_conversion_success"] = False
            result["debug_info"]["sympy_conversion_error"] = str(e)
            print(f"[DEBUG] SymPy conversion failed: {e}")
            return result
        
        # 4. Extract equation for solving
        try:
            if isinstance(sympy_out, list):
                # Handle list of solutions
                result["equation"] = str(sympy_out[0]) if sympy_out else "No equation found"
                result["debug_info"]["equation_type"] = "solution_list"
            elif hasattr(sympy_out, 'lhs') and hasattr(sympy_out, 'rhs'):
                # Handle equality
                result["equation"] = f"{sympy_out.lhs} = {sympy_out.rhs}"
                result["debug_info"]["equation_type"] = "equality"
            else:
                # Handle expression (treat as = 0)
                result["equation"] = f"{sympy_out} = 0"
                result["debug_info"]["equation_type"] = "expression"
            
            result["debug_info"]["equation_extraction_success"] = True
            print(f"[DEBUG] Extracted equation: {result['equation']}")
        except Exception as e:
            result["error"] = f"Equation extraction failed: {str(e)}"
            result["debug_info"]["equation_extraction_success"] = False
            result["debug_info"]["equation_extraction_error"] = str(e)
            print(f"[DEBUG] Equation extraction failed: {e}")
            return result
        
        # 5. Try to solve (optional)
        try:
            if isinstance(sympy_out, list):
                result["solutions"] = format_solutions(sympy_out)
            else:
                sols = solve_sympy_expr(sympy_out)
                result["solutions"] = format_solutions(sols)
            result["debug_info"]["solving_success"] = True
        except Exception as solve_error:
            result["debug_info"]["solving_success"] = False
            result["debug_info"]["solving_error"] = str(solve_error)
            print(f"[DEBUG] Solving failed but continuing: {solve_error}")
            result["solutions"] = "Expression parsed but solving failed"
        
        # 6. Pretty print
        try:
            result["pretty"] = sp.pretty(sympy_out)
            result["debug_info"]["pretty_print_success"] = True
        except Exception:
            result["pretty"] = str(sympy_out)
            result["debug_info"]["pretty_print_success"] = False
        
        # 7. Add validation info
        result["debug_info"]["input_image"] = image_path
        result["debug_info"]["simpletex_token"] = SIMPLETEX_UAT[:10] + "..." if SIMPLETEX_UAT else "None"
        
        print(f"[DEBUG] Process completed successfully")
        print(f"[DEBUG] Final equation: {result['equation']}")
        
    except Exception as e:
        result["error"] = str(e)
        result["debug_info"]["overall_error"] = str(e)
        print(f"[DEBUG] process_image overall error: {e}")
        import traceback
        print(f"[DEBUG] Full traceback: {traceback.format_exc()}")
    
    return result

if __name__ == "__main__":
    if len(sys.argv) > 1:
        SIMPLETEX_UAT = sys.argv[1]
    if SIMPLETEX_UAT == "YOUR_UAT_TOKEN_HERE":
        print("Please set SIMPLETEX_UAT variable in the script or pass it as an argument.")
        print("Usage: python math_ocr_pipeline.py <YOUR_UAT_TOKEN>")
    else:
        main(IMAGE_PATH)
