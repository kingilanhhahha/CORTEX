#!/usr/bin/env python3
"""
Working Drawing Solver - OCR button included with graceful dependency handling
"""

import tkinter as tk
from tkinter import ttk, messagebox
import os
import tempfile

# Try to import modules, but handle missing dependencies gracefully
try:
    import lcd
    OCR_AVAILABLE = True
except ImportError as e:
    print(f"OCR module not available: {e}")
    OCR_AVAILABLE = False

try:
    import olol_hahahaa
    SOLVER_AVAILABLE = True
except ImportError as e:
    print(f"Solver module not available: {e}")
    SOLVER_AVAILABLE = False

class DrawingArea:
    def __init__(self, parent):
        self.parent = parent
        self.canvas = tk.Canvas(parent, width=600, height=400, bg='white', cursor='cross')
        self.canvas.pack(pady=10)
        
        # Drawing variables
        self.drawing = False
        self.last_x = None
        self.last_y = None
        self.lines = []
        self.current_line = []
        
        # Bind mouse events
        self.canvas.bind('<Button-1>', self.start_draw)
        self.canvas.bind('<B1-Motion>', self.draw)
        self.canvas.bind('<ButtonRelease-1>', self.stop_draw)
        
        # Clear button
        self.clear_btn = tk.Button(parent, text="Clear Drawing", command=self.clear_canvas)
        self.clear_btn.pack(pady=5)
        
    def start_draw(self, event):
        self.drawing = True
        self.last_x = event.x
        self.last_y = event.y
        self.current_line = [(event.x, event.y)]
        
    def draw(self, event):
        if self.drawing:
            if self.last_x and self.last_y:
                self.canvas.create_line(self.last_x, self.last_y, event.x, event.y, 
                                     fill='black', width=3, smooth=True)
                self.current_line.append((event.x, event.y))
            self.last_x = event.x
            self.last_y = event.y
            
    def stop_draw(self, event):
        self.drawing = False
        if self.current_line:
            self.lines.append(self.current_line)
            self.current_line = []
            
    def clear_canvas(self):
        self.canvas.delete("all")
        self.lines = []
        self.current_line = []
        
    def get_drawing_as_image(self):
        """Convert canvas drawing to PIL Image using direct canvas capture"""
        try:
            # Get canvas dimensions
            width = self.canvas.winfo_width()
            height = self.canvas.winfo_height()
            
            # Create a PIL Image with the same dimensions
            from PIL import Image, ImageDraw
            
            img = Image.new('RGB', (width, height), 'white')
            draw = ImageDraw.Draw(img)
            
            # Draw all the lines from the stored drawing data
            for line in self.lines:
                if len(line) > 1:
                    # Convert canvas coordinates to image coordinates
                    points = [(x, y) for x, y in line]
                    # Draw the line with black color and appropriate thickness
                    draw.line(points, fill='black', width=3)
            
            return img
            
        except Exception as e:
            print(f"Image conversion failed: {e}")
            # Return a basic white image as fallback
            from PIL import Image
            return Image.new('RGB', (600, 400), 'white')

class WorkingDrawingSolverApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Working Drawing Equation Solver")
        self.root.geometry("1200x800")
        
        # Configure style
        style = ttk.Style()
        style.theme_use('clam')
        
        # Create main frame
        main_frame = ttk.Frame(root)
        main_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Title
        title_label = ttk.Label(main_frame, text="Working Drawing Equation Solver", 
                               font=('Arial', 16, 'bold'))
        title_label.pack(pady=(0, 20))
        
        # Status indicator
        status_indicator = ttk.Label(main_frame, text="", font=('Arial', 10))
        status_indicator.pack(pady=(0, 10))
        
        if OCR_AVAILABLE and SOLVER_AVAILABLE:
            status_indicator.config(text="✓ All modules loaded successfully", foreground="green")
        elif OCR_AVAILABLE:
            status_indicator.config(text="⚠ OCR available, Solver missing", foreground="orange")
        elif SOLVER_AVAILABLE:
            status_indicator.config(text="⚠ Solver available, OCR missing", foreground="orange")
        else:
            status_indicator.config(text="❌ No modules available - interface only", foreground="red")
        
        # Create left and right panels
        left_panel = ttk.Frame(main_frame)
        left_panel.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0, 10))
        
        right_panel = ttk.Frame(main_frame)
        right_panel.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True, padx=(10, 0))
        
        # Left panel - Drawing area
        drawing_label = ttk.Label(left_panel, text="Draw your equation here:", 
                                 font=('Arial', 12, 'bold'))
        drawing_label.pack(pady=(0, 10))
        
        self.drawing_area = DrawingArea(left_panel)
        
        # OCR and Solve buttons
        button_frame = ttk.Frame(left_panel)
        button_frame.pack(pady=10)
        
        # OCR Button - Always visible
        self.ocr_btn = ttk.Button(button_frame, text="Process Drawing (OCR)", 
                                   command=self.process_drawing)
        self.ocr_btn.pack(side=tk.LEFT, padx=5)
        
        # Solve Button - Always visible
        self.solve_btn = ttk.Button(button_frame, text="Solve Equation", 
                                    command=self.solve_equation)
        self.solve_btn.pack(side=tk.LEFT, padx=5)
        
        # Calculator Button - Switch to calculator mode (make it more prominent)
        self.calc_btn = ttk.Button(button_frame, text="🧮 Calculator", 
                                   command=self.show_calculator, style='Accent.TButton')
        self.calc_btn.pack(side=tk.LEFT, padx=5)
        
        # Add a separator and make calculator more visible
        separator = ttk.Separator(left_panel, orient='horizontal')
        separator.pack(fill=tk.X, pady=10)
        
        # Calculator section label
        calc_label = ttk.Label(left_panel, text="🧮 Quick Calculator Access:", 
                              font=('Arial', 10, 'bold'))
        calc_label.pack(pady=(10, 5))
        
        # Alternative calculator button (larger and more visible)
        self.calc_btn2 = ttk.Button(left_panel, text="🧮 Open Calculator", 
                                    command=self.show_calculator, style='Accent.TButton')
        self.calc_btn2.pack(pady=5)
        
        # Manual input section
        input_label = ttk.Label(left_panel, text="Or manually enter equation:", 
                               font=('Arial', 12, 'bold'))
        input_label.pack(pady=(20, 5))
        
        self.equation_entry = tk.Entry(left_panel, width=50, font=('Arial', 10))
        self.equation_entry.pack(pady=(0, 10))
        self.equation_entry.insert(0, "Eq((x**2 - 4)/(x - 2), x + 2)")
        
        # Right panel - Results
        results_label = ttk.Label(right_panel, text="Results:", 
                                 font=('Arial', 12, 'bold'))
        results_label.pack(pady=(0, 10))
        
        # Create notebook for different result tabs
        self.notebook = ttk.Notebook(right_panel)
        self.notebook.pack(fill=tk.BOTH, expand=True)
        
        # OCR Results tab
        self.ocr_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.ocr_frame, text="OCR Results")
        
        self.latex_label = ttk.Label(self.ocr_frame, text="LaTeX Output:", 
                                     font=('Arial', 10, 'bold'))
        self.latex_label.pack(anchor=tk.W, pady=(10, 5))
        
        self.latex_text = tk.Text(self.ocr_frame, height=6, width=50, wrap=tk.WORD)
        self.latex_text.pack(fill=tk.X, padx=10, pady=(0, 10))
        
        self.sympy_label = ttk.Label(self.ocr_frame, text="SymPy Output:", 
                                     font=('Arial', 10, 'bold'))
        self.sympy_label.pack(anchor=tk.W, pady=(10, 5))
        
        self.sympy_text = tk.Text(self.ocr_frame, height=6, width=50, wrap=tk.WORD)
        self.sympy_text.pack(fill=tk.X, padx=10, pady=(0, 10))
        
        # Solution Results tab
        self.solution_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.solution_frame, text="Solution")
        
        self.solution_text = tk.Text(self.solution_frame, height=20, width=50, wrap=tk.WORD)
        self.solution_text.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Calculator tab
        self.calc_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.calc_frame, text="🧮 Calculator")
        
        # Calculator interface
        self.setup_calculator()
        
        # Add keyboard shortcuts
        self.root.bind('<Control-c>', lambda e: self.show_calculator())
        self.root.bind('<Control-C>', lambda e: self.show_calculator())
        
        # Make calculator tab more prominent
        self.notebook.tab(2, text="🧮 Calculator (Ctrl+C)")
        
        # Status bar
        self.status_var = tk.StringVar()
        self.status_var.set("Ready - Draw an equation and click 'Process Drawing' or enter manually. Use 🧮 Calculator button or press Ctrl+C for calculator!")
        self.status_bar = ttk.Label(root, textvariable=self.status_var, 
                                   relief=tk.SUNKEN, anchor=tk.W)
        self.status_bar.pack(side=tk.BOTTOM, fill=tk.X)
        
        # Store current equation data
        self.current_equation = None
        self.current_sympy = None
        
    def process_drawing(self):
        """Process the drawing through OCR"""
        if not OCR_AVAILABLE:
            messagebox.showwarning("OCR Not Available", 
                                 "OCR functionality is not available due to missing dependencies.\n"
                                 "Please install the required packages or use manual input.")
            return
            
        try:
            self.status_var.set("Processing drawing...")
            self.root.update()
            
            # Get drawing as image
            img = self.drawing_area.get_drawing_as_image()
            
            # Save to temporary file
            temp_file = tempfile.NamedTemporaryFile(suffix='.png', delete=False)
            temp_file.close()
            img.save(temp_file.name, 'PNG')
            
            # Process through OCR
            result = lcd.process_image(temp_file.name)
            
            # Clean up temp file
            os.unlink(temp_file.name)
            
            if result["error"]:
                messagebox.showerror("OCR Error", f"Failed to process image: {result['error']}")
                self.status_var.set("OCR processing failed")
                return
            
            # Display results
            self.latex_text.delete(1.0, tk.END)
            self.latex_text.insert(1.0, result.get("latex_raw", "No LaTeX output"))
            
            self.sympy_text.delete(1.0, tk.END)
            sympy_output = str(result.get("sympy_out", "No SymPy output"))
            self.sympy_text.insert(1.0, sympy_output)
            
            # Store the equation data
            self.current_equation = result.get("latex_raw", "")
            self.current_sympy = result.get("sympy_out", "")
            
            # Enable solve button if we have a valid equation
            if self.current_sympy is not None and not result["error"]:
                self.status_var.set("OCR completed successfully - Click 'Solve Equation' to continue")
            else:
                self.status_var.set("OCR completed but no valid equation found")
                
        except Exception as e:
            messagebox.showerror("Error", f"An error occurred: {str(e)}")
            self.status_var.set("Error occurred during processing")
            
    def solve_equation(self):
        """Solve the equation using the solving.py module or manual input"""
        if not SOLVER_AVAILABLE:
            messagebox.showwarning("Solver Not Available", 
                                 "Equation solver is not available due to missing dependencies.\n"
                                 "Please install the required packages.")
            return
            
        try:
            # Get equation from entry field if no OCR result
            if self.current_sympy is None:
                equation_str = self.equation_entry.get().strip()
                if not equation_str:
                    messagebox.showwarning("Warning", "Please enter an equation to solve")
                    return
            else:
                # Convert sympy output to string format for the solver
                if hasattr(self.current_sympy, 'lhs') and hasattr(self.current_sympy, 'rhs'):
                    # It's an equation object - convert to string format
                    lhs_str = str(self.current_sympy.lhs)
                    rhs_str = str(self.current_sympy.rhs)
                    equation_str = f"{lhs_str}={rhs_str}"
                    print(f"Debug: Converted SymPy equation to: {equation_str}")
                else:
                    # It's a different format, try to convert
                    equation_str = str(self.current_sympy)
                    print(f"Debug: Using string format: {equation_str}")
            
            # Handle Eq(...) format - extract content and convert to equation
            if equation_str.startswith('Eq(') and equation_str.endswith(')'):
                print(f"Debug: Found Eq format: {equation_str}")
                # Extract content from Eq(..., ...) format
                content = equation_str[3:-1]  # Remove 'Eq(' and ')'
                print(f"Debug: Extracted content: {content}")
                
                # Find the comma that separates left and right sides
                # We need to be careful about commas inside parentheses
                paren_count = 0
                split_pos = -1
                
                for i, char in enumerate(content):
                    if char == '(':
                        paren_count += 1
                    elif char == ')':
                        paren_count -= 1
                    elif char == ',' and paren_count == 0:
                        split_pos = i
                        break
                
                if split_pos != -1:
                    left_side = content[:split_pos]
                    right_side = content[split_pos + 1:]
                    equation_str = f"{left_side}={right_side}"
                    print(f"Debug: Converted Eq to equation: {equation_str}")
                else:
                    # If no comma found, treat as single expression = 0
                    equation_str = f"{content}=0"
                    print(f"Debug: No comma found, treating as: {equation_str}")
            
            # Handle OCR errors: replace comma with equal sign
            # This helps with common OCR misreadings where "," is read instead of "="
            if ',' in equation_str and '=' not in equation_str:
                equation_str = equation_str.replace(',', '=')
                print(f"Debug: Replaced comma with equals: {equation_str}")
            
            print(f"Debug: Final equation to solve: {equation_str}")
            
            self.status_var.set("Solving equation...")
            self.root.update()
            
            # Switch to solution tab
            self.notebook.select(1)
            
            # Clear previous solution
            self.solution_text.delete(1.0, tk.END)
            
            # Capture the solver output
            import io
            import sys
            
            # Redirect stdout to capture solver output
            old_stdout = sys.stdout
            new_stdout = io.StringIO()
            sys.stdout = new_stdout
            
            try:
                # Run the enhanced solver
                solver_output = olol_hahahaa.stepwise_rational_solution_with_explanations(equation_str)
                
                # Display the solution
                self.solution_text.insert(1.0, solver_output)
                
                self.status_var.set("Equation solved successfully")
                
            finally:
                # Restore stdout
                sys.stdout = old_stdout
                
        except Exception as e:
            error_msg = f"Error solving equation: {str(e)}"
            self.solution_text.insert(1.0, f"ERROR: {error_msg}")
            self.status_var.set("Error solving equation")
            messagebox.showerror("Solving Error", error_msg)

    def show_calculator(self):
        """Switch to calculator tab"""
        self.notebook.select(2)  # Switch to calculator tab (index 2)
        self.status_var.set("Calculator mode - Enter expressions to calculate")
        
    def setup_calculator(self):
        """Setup the calculator interface"""
        # Calculator display
        calc_display_frame = ttk.Frame(self.calc_frame)
        calc_display_frame.pack(fill=tk.X, padx=10, pady=10)
        
        ttk.Label(calc_display_frame, text="Calculator:", font=('Arial', 12, 'bold')).pack(anchor=tk.W)
        
        # Expression entry
        self.calc_entry = tk.Entry(calc_display_frame, width=50, font=('Arial', 12))
        self.calc_entry.pack(fill=tk.X, pady=(5, 10))
        self.calc_entry.insert(0, "2 + 3 * 4")
        
        # Calculate button
        calc_btn_frame = ttk.Frame(calc_display_frame)
        calc_btn_frame.pack(fill=tk.X)
        
        ttk.Button(calc_btn_frame, text="Calculate", 
                   command=self.calculate_expression).pack(side=tk.LEFT, padx=(0, 10))
        ttk.Button(calc_btn_frame, text="Clear", 
                   command=self.clear_calculator).pack(side=tk.LEFT)
        
        # Result display
        result_frame = ttk.Frame(self.calc_frame)
        result_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        ttk.Label(result_frame, text="Result:", font=('Arial', 10, 'bold')).pack(anchor=tk.W)
        
        self.calc_result = tk.Text(result_frame, height=10, width=50, wrap=tk.WORD)
        self.calc_result.pack(fill=tk.BOTH, expand=True)
        
        # Quick examples
        examples_frame = ttk.Frame(self.calc_frame)
        examples_frame.pack(fill=tk.X, padx=10, pady=10)
        
        ttk.Label(examples_frame, text="Quick Examples:", font=('Arial', 10, 'bold')).pack(anchor=tk.W)
        
        examples = [
            "2 + 3 * 4",
            "sqrt(16)",
            "sin(pi/2)",
            "x**2 + 2*x + 1",
            "integrate(x**2, x)",
            "solve(x**2 - 4, x)"
        ]
        
        for example in examples:
            btn = ttk.Button(examples_frame, text=example, 
                           command=lambda e=example: self.load_example(e))
            btn.pack(side=tk.LEFT, padx=(0, 5), pady=5)
            
    def load_example(self, example):
        """Load an example into the calculator"""
        self.calc_entry.delete(0, tk.END)
        self.calc_entry.insert(0, example)
        
    def clear_calculator(self):
        """Clear calculator input and result"""
        self.calc_entry.delete(0, tk.END)
        self.calc_result.delete(1.0, tk.END)
        
    def calculate_expression(self):
        """Calculate the expression entered in the calculator"""
        try:
            expression = self.calc_entry.get().strip()
            if not expression:
                messagebox.showwarning("Warning", "Please enter an expression to calculate")
                return
                
            self.calc_result.delete(1.0, tk.END)
            self.calc_result.insert(1.0, f"Calculating: {expression}\n\n")
            
            # Try to evaluate the expression
            import sympy as sp
            
            # Handle different types of expressions
            if '=' in expression:
                # It's an equation - try to solve it
                try:
                    if expression.startswith('solve('):
                        # Handle solve format: solve(expr, var)
                        import re
                        match = re.match(r'solve\((.*?),\s*(.*?)\)', expression)
                        if match:
                            expr_str, var_str = match.groups()
                            expr = sp.sympify(expr_str)
                            var = sp.sympify(var_str)
                            solution = sp.solve(expr, var)
                            result = f"Solution for {var_str}:\n{solution}"
                        else:
                            result = "Invalid solve format. Use: solve(expression, variable)"
                    else:
                        # Regular equation
                        lhs_str, rhs_str = expression.split('=', 1)
                        lhs = sp.sympify(lhs_str)
                        rhs = sp.sympify(rhs_str)
                        solution = sp.solve(sp.Eq(lhs, rhs))
                        result = f"Solution: {solution}"
                except Exception as e:
                    result = f"Error solving equation: {str(e)}"
                    
            elif 'integrate(' in expression:
                # Handle integration
                try:
                    import re
                    match = re.match(r'integrate\((.*?),\s*(.*?)\)', expression)
                    if match:
                        expr_str, var_str = match.groups()
                        expr = sp.sympify(expr_str)
                        var = sp.sympify(var_str)
                        integral = sp.integrate(expr, var)
                        result = f"∫ {expr_str} d{var_str} = {integral}"
                    else:
                        result = "Invalid integrate format. Use: integrate(expression, variable)"
                except Exception as e:
                    result = f"Error integrating: {str(e)}"
                    
            else:
                # Regular expression - evaluate it
                try:
                    expr = sp.sympify(expression)
                    result = f"Result: {expr}\n"
                    result += f"Simplified: {sp.simplify(expr)}\n"
                    result += f"Decimal: {sp.N(expr, 8)}"
                except Exception as e:
                    result = f"Error evaluating expression: {str(e)}"
            
            self.calc_result.insert(tk.END, f"\n{result}")
            
        except Exception as e:
            error_msg = f"Calculator error: {str(e)}"
            self.calc_result.insert(tk.END, f"\nERROR: {error_msg}")
            messagebox.showerror("Calculator Error", error_msg)

def main():
    root = tk.Tk()
    app = WorkingDrawingSolverApp(root)
    root.mainloop()

if __name__ == "__main__":
    main()


