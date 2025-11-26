"""
math_ocr_pipeline.py
Headless pipeline (image path mode) with robust LaTeX cleaning and handling
of latex2sympy2 list outputs.

Replace SIMPLETEX_UAT with your UAT token.
"""
import re
import sys
import time
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
def send_to_simpletex(image_path, token, api_url=SIMPLETEX_API_URL, timeout=20, max_retries=3):
    """
    Send image to SimpleTex API with retry logic for network failures.
    Handles network connection changes gracefully.
    """
    headers = {"token": token}
    last_error = None
    
    for attempt in range(max_retries):
        try:
            with open(image_path, "rb") as f:
                files = {"file": ("image.png", f, "image/png")}
                try:
                    resp = requests.post(api_url, headers=headers, files=files, timeout=timeout)
                    resp.raise_for_status()
                    
                    # Request succeeded, process response
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
                    
                except (requests.exceptions.ConnectionError, 
                        requests.exceptions.Timeout,
                        requests.exceptions.SSLError,
                        requests.exceptions.ChunkedEncodingError,
                        requests.exceptions.ProxyError) as e:
                    # Network-related errors - retry if we have attempts left
                    last_error = e
                    if attempt < max_retries - 1:
                        print(f"[DEBUG] Network error (attempt {attempt + 1}/{max_retries}): {type(e).__name__}: {e}. Retrying...")
                        time.sleep(1)  # Wait 1 second before retry
                        continue
                    else:
                        # Last attempt failed
                        error_msg = f"Network connection failed after {max_retries} attempts. "
                        if isinstance(e, requests.exceptions.ConnectionError):
                            error_msg += "Please check your internet connection."
                        elif isinstance(e, requests.exceptions.Timeout):
                            error_msg += "Request timed out. The server may be slow or unreachable."
                        elif isinstance(e, requests.exceptions.SSLError):
                            error_msg += "SSL connection error. Please check your network connection."
                        else:
                            error_msg += "Network error occurred. Please check your internet connection."
                        raise RuntimeError(error_msg) from e
                except requests.exceptions.RequestException as e:
                    # Other request errors - check if it's network-related
                    error_str = str(e).lower()
                    if any(keyword in error_str for keyword in ['connection', 'network', 'timeout', 'dns', 'socket', 'ssl']):
                        # It's a network-related error, retry
                        last_error = e
                        if attempt < max_retries - 1:
                            print(f"[DEBUG] Network-related error (attempt {attempt + 1}/{max_retries}): {e}. Retrying...")
                            time.sleep(1)
                            continue
                        else:
                            raise RuntimeError(f"Network connection failed after {max_retries} attempts. Please check your internet connection.") from e
                    else:
                        # Other request errors - don't retry
                        raise RuntimeError(f"SimpleTex API error: {e}") from e
                    
        except FileNotFoundError:
            # File error - don't retry
            raise RuntimeError(f"Image file not found: {image_path}")
        except (OSError, IOError) as e:
            # OS-level errors that might be network-related (DNS, socket errors, etc.)
            error_str = str(e).lower()
            if any(keyword in error_str for keyword in ['connection', 'network', 'timeout', 'dns', 'socket', 'name resolution', 'unreachable']):
                last_error = e
                if attempt < max_retries - 1:
                    print(f"[DEBUG] OS-level network error (attempt {attempt + 1}/{max_retries}): {e}. Retrying...")
                    time.sleep(1)
                    continue
                else:
                    raise RuntimeError(f"Network connection failed after {max_retries} attempts. Please check your internet connection.") from e
            else:
                # Other OS errors - don't retry
                raise RuntimeError(f"System error: {e}") from e
        except Exception as e:
            # Unexpected errors - check if it's network-related
            error_str = str(e).lower()
            if any(keyword in error_str for keyword in ['connection', 'network', 'timeout', 'dns', 'socket', 'ssl']):
                last_error = e
                if attempt < max_retries - 1:
                    print(f"[DEBUG] Unexpected network error (attempt {attempt + 1}/{max_retries}): {e}. Retrying...")
                    time.sleep(1)
                    continue
            # Don't retry other unexpected errors
            raise
    
    # If we get here, all retries failed
    if last_error:
        error_msg = f"Network connection failed after {max_retries} attempts. "
        if isinstance(last_error, requests.exceptions.ConnectionError):
            error_msg += "Please check your internet connection and try again."
        elif isinstance(last_error, requests.exceptions.Timeout):
            error_msg += "Request timed out. Please check your network connection."
        raise RuntimeError(error_msg) from last_error
    raise RuntimeError("Failed to connect to SimpleTex API after multiple attempts.")

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
    s = s.replace("\\times", "*").replace("\\cdot", "*")
    s = s.replace("×", "*")
    s = s.replace("\\,", "")
    s = s.replace("\\;", "")
    s = s.replace("\\!","")
    s = re.sub(r'[\u200B-\u200D\uFEFF\u00A0]', '', s)
    s = re.sub(r'\\frac\s*([^{\\\s]+)\s*([^{\\\s]+)', r'\\frac{\1}{\2}', s)

    # Enhanced bracket-equation handler: handles parentheses inside brackets,
    # missing closing brackets, and malformed cases like (x-1)[...=...)(x-1)
    if '[' in s and '=' in s:
        # Find the opening bracket
        bracket_start = s.find('[')
        if bracket_start != -1:
            # Extract prefix (everything before the bracket)
            prefix_raw = s[:bracket_start].strip()
            # Find the closing bracket, but handle cases where ) appears before ]
            bracket_end = s.find(']', bracket_start + 1)
            if bracket_end == -1:
                # Missing closing bracket - try to infer from structure
                # Look for pattern like [...=...)(... where ) appears before ]
                paren_before_bracket = s.find(')', bracket_start + 1)
                if paren_before_bracket != -1 and '=' in s[bracket_start+1:paren_before_bracket]:
                    # This might be a malformed bracket equation
                    # Try to find where the postfix starts
                    # Look for pattern like [...=...)(postfix)
                    inner_end = paren_before_bracket
                    # Extract everything after the first ) as potential postfix
                    remaining = s[paren_before_bracket+1:].strip()
                    # Try to find a closing bracket or use the rest as postfix
                    bracket_end = s.find(']', paren_before_bracket + 1)
                    if bracket_end == -1:
                        # No closing bracket found - infer from structure
                        # The inner content should be between [ and the first ) after =
                        inner_content = s[bracket_start+1:inner_end]
                        postfix_raw = remaining
                    else:
                        inner_content = s[bracket_start+1:bracket_end]
                        postfix_raw = s[bracket_end+1:].strip()
                else:
                    # No closing bracket and no ) before bracket - try to find end
                    # Look for pattern that suggests end of equation
                    if '=' in s[bracket_start+1:]:
                        # Find the = sign and try to extract inner content
                        eq_pos = s.find('=', bracket_start + 1)
                        # Take everything from [ to end as inner, no postfix
                        inner_content = s[bracket_start+1:].strip()
                        postfix_raw = ''
                        bracket_end = len(s)
                    else:
                        inner_content = s[bracket_start+1:].strip()
                        postfix_raw = ''
                        bracket_end = len(s)
            else:
                # Normal case: bracket found
                inner_content = s[bracket_start+1:bracket_end]
                postfix_raw = s[bracket_end+1:].strip()
            
            # Check if inner content has an equation
            if '=' in inner_content:
                lhs_raw, rhs_raw = inner_content.split('=', 1)
                
                # Normalize prefix - handle parentheses and implicit multiplication
                prefix = prefix_raw
                if prefix:
                    # Remove leading/trailing parentheses if they're just wrapping
                    prefix = prefix.strip()
                    # Normalize implicit multiplication
                    prefix = re.sub(r"(?<=\d)(?=[A-Za-z\(])", "*", prefix)
                    prefix = re.sub(r"(?<=[A-Za-z\)])\s*(?=[A-Za-z\(])", "*", prefix)
                
                # Normalize postfix - handle parentheses and implicit multiplication
                postfix = postfix_raw
                if postfix:
                    # Remove leading/trailing parentheses if they're just wrapping
                    postfix = postfix.strip()
                    # Normalize implicit multiplication
                    postfix = re.sub(r"(?<=\d)(?=[A-Za-z\(])", "*", postfix)
                    postfix = re.sub(r"(?<=[A-Za-z\)])\s*(?=[A-Za-z\(])", "*", postfix)
                
                # Clean up unmatched parentheses in prefix and postfix
                def clean_unmatched_parens(txt: str) -> str:
                    if not txt:
                        return txt
                    # Count parentheses
                    open_count = txt.count('(')
                    close_count = txt.count(')')
                    # Remove excess closing parentheses from start
                    if close_count > open_count:
                        excess = close_count - open_count
                        txt = re.sub(r'^\)+', '', txt, count=excess)
                    # Remove excess opening parentheses from end
                    open_count = txt.count('(')
                    close_count = txt.count(')')
                    if open_count > close_count:
                        excess = open_count - close_count
                        txt = re.sub(r'\(+$', '', txt, count=excess)
                    return txt.strip()
                
                prefix = clean_unmatched_parens(prefix)
                postfix = clean_unmatched_parens(postfix)
                
                # Build total multiplier
                parts = [p for p in [prefix, postfix] if p]
                if parts:
                    total = '*'.join(parts)
                else:
                    total = '1'
                
                # Remove spaces around = for consistency
                lhs_raw = lhs_raw.strip()
                rhs_raw = rhs_raw.strip()
                
                s = f"{total}*({lhs_raw})={total}*({rhs_raw})"

    s = re.sub(r'\s+', ' ', s).strip()
    return s

def to_checker_equation(input_text: str) -> str:
    """
    Convert OCR/LaTeX/TeX-ish math into the checker-accepted form: "lhs=rhs".
    - Preserves equation structure; emits explicit '*'
    - Supports Eq(lhs,rhs), comma-as-equals, and bracket equations A[ lhs = rhs ]B
    Raises ValueError when an equation cannot be produced.
    """
    if not isinstance(input_text, str) or not input_text.strip():
        raise ValueError("Empty equation")

    s = input_text.strip()

    # 1) Clean artifacts and basic LaTeX fixes
    s = preprocess_latex_for_rationals(s)

    # 2) If Eq(lhs,rhs) form → lhs=rhs
    if s.startswith('Eq(') and s.endswith(')'):
        content = s[3:-1]
        depth = 0
        split_idx = -1
        for i, ch in enumerate(content):
            if ch == '(':
                depth += 1
            elif ch == ')':
                depth -= 1
            elif ch == ',' and depth == 0:
                split_idx = i
                break
        if split_idx != -1:
            lhs = content[:split_idx].strip()
            rhs = content[split_idx + 1:].strip()
            s = f"{lhs}={rhs}"

    # 3) Comma used as equals
    if ',' in s and '=' not in s:
        s = s.replace(',', '=')

    # 4) Enhanced bracket-equation A[ lhs = rhs ]B – handles malformed cases
    # More robust bracket parsing that accounts for nested parentheses
    # Handles malformed cases where ) appears before ]
    if '[' in s and '=' in s:
        bracket_start = s.find('[')
        if bracket_start != -1:
            # Extract prefix (everything before the bracket)
            prefix_raw = s[:bracket_start].strip()
            
            # Find closing bracket, handling cases where ) appears before ]
            bracket_end = s.find(']', bracket_start + 1)
            if bracket_end == -1:
                # Missing closing bracket - try to infer from structure
                paren_before_bracket = s.find(')', bracket_start + 1)
                if paren_before_bracket != -1 and '=' in s[bracket_start+1:paren_before_bracket]:
                    # Malformed case: ) appears before ]
                    inner_end = paren_before_bracket
                    remaining = s[paren_before_bracket+1:].strip()
                    bracket_end = s.find(']', paren_before_bracket + 1)
                    if bracket_end == -1:
                        # No closing bracket - infer structure
                        inner_content = s[bracket_start+1:inner_end]
                        postfix_raw = remaining
                    else:
                        inner_content = s[bracket_start+1:bracket_end]
                        postfix_raw = s[bracket_end+1:].strip()
                else:
                    # No closing bracket and no ) before bracket
                    if '=' in s[bracket_start+1:]:
                        inner_content = s[bracket_start+1:].strip()
                        postfix_raw = ''
                    else:
                        inner_content = s[bracket_start+1:].strip()
                        postfix_raw = ''
            else:
                # Normal case: bracket found
                inner_content = s[bracket_start+1:bracket_end]
                postfix_raw = s[bracket_end+1:].strip()
            
            # Check if inner content has an equation
            if '=' in inner_content:
                lhs_raw, rhs_raw = inner_content.split('=', 1)
                
                # Normalize prefix and postfix factors with proper multiplication signs
                def norm_factor(txt: str) -> str:
                    if not txt:
                        return ''
                    txt = txt.strip()
                    # Handle parentheses properly
                    # Remove wrapping parentheses if they're just decorative
                    while txt.startswith('(') and txt.endswith(')'):
                        # Check if it's a balanced wrapper
                        inner = txt[1:-1]
                        if inner.count('(') == inner.count(')'):
                            # Check if it's safe to remove (no leading operators)
                            if not inner.startswith(('+', '-', '*', '/', '=')):
                                txt = inner.strip()
                            else:
                                break
                        else:
                            break
                    # Insert * between number and symbol, or between symbol boundaries
                    txt = re.sub(r"(?<=\d)(?=[A-Za-z\(])", "*", txt)
                    txt = re.sub(r"(?<=[A-Za-z\)])\s*(?=[A-Za-z\(])", "*", txt)
                    # Handle implicit multiplication after closing paren
                    txt = re.sub(r"\)\s*(?=[A-Za-z\(])", ")*", txt)
                    return txt
                
                prefix = norm_factor(prefix_raw)
                postfix = norm_factor(postfix_raw)
                
                # Build total multiplier
                parts = [p for p in [prefix, postfix] if p]
                total = '*'.join(parts) if parts else '1'
                
                # Remove spaces around = for consistency
                lhs_raw = lhs_raw.strip()
                rhs_raw = rhs_raw.strip()
                
                s = f"{total}*({lhs_raw})={total}*({rhs_raw})"

    # 5) Insert explicit multiplication in common spots
    s = re.sub(r"(?<=\d)(?=[A-Za-z])", "*", s)           # 2x → 2*x
    s = re.sub(r"\)\s*(?=[A-Za-z\(])", ")*", s)         # )( or )x → )*
    s = re.sub(r"(?<=[A-Za-z\)])\s*\(", "*(", s)        # x( → x*(

    # 6) Final guard: ensure exactly one '=' or try LaTeX→SymPy Equality
    if s.count('=') != 1:
        try:
            expr = latex_to_sympy_via_latex2sympy(s)
            if isinstance(expr, Eq):
                return f"{str(expr.lhs)}={str(expr.rhs)}"
        except Exception:
            pass
        raise ValueError("Equation must contain exactly one '='")

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
        "sympy_out": None,
        "solutions": None,
        "pretty": None,
        "error": None
    }
    try:
        latex_raw = send_to_simpletex(image_path, SIMPLETEX_UAT)
        result["latex_raw"] = latex_raw
        
        sympy_out = latex_to_sympy_via_latex2sympy(latex_raw)
        # Convert SymPy object to string for JSON serialization
        result["sympy_out"] = str(sympy_out)
        
        # Handle different types of sympy output
        if isinstance(sympy_out, list):
            result["solutions"] = format_solutions(sympy_out)
        else:
            try:
                sols = solve_sympy_expr(sympy_out)
                result["solutions"] = format_solutions(sols)
            except Exception as solve_error:
                # If solving fails, just store the sympy expression without solutions
                print(f"[DEBUG] Solving failed but continuing: {solve_error}")
                result["solutions"] = "Expression parsed but solving failed"
        
        try:
            result["pretty"] = sp.pretty(sympy_out)
        except Exception:
            result["pretty"] = str(sympy_out)
            
    except Exception as e:
        result["error"] = str(e)
        print(f"[DEBUG] process_image error: {e}")
    
    return result

if __name__ == "__main__":
    if len(sys.argv) > 1:
        SIMPLETEX_UAT = sys.argv[1]
    if SIMPLETEX_UAT == "YOUR_UAT_TOKEN_HERE":
        print("Please set SIMPLETEX_UAT variable in the script or pass it as an argument.")
        print("Usage: python math_ocr_pipeline.py <YOUR_UAT_TOKEN>")
    else:
        main(IMAGE_PATH)
