def add(a, b):
    return a + b

def subtract(a, b):
    return a - b

def multiply(a, b):
    return a * b

def divide(a, b):
    if b == 0:
        raise ValueError("Cannot divide by zero")
    return a / b

OPERATIONS = {
    '+': add,
    '-': subtract,
    '*': multiply,
    '/': divide,
}

def main():
    print("Simple Calculator — type 'quit' to exit")
    while True:
        expression = input("\nEnter expression (e.g. 3 + 4): ").strip()
        if expression.lower() == 'quit':
            break

        parts = expression.split()
        if len(parts) != 3:
            print("Invalid format. Use: <number> <operator> <number>")
            continue

        left, op, right = parts
        if op not in OPERATIONS:
            print(f"Unknown operator '{op}'. Use: {', '.join(OPERATIONS)}")
            continue

        try:
            result = OPERATIONS[op](float(left), float(right))
            print(f"= {result:g}")
        except ValueError as e:
            print(f"Error: {e}")
        except Exception:
            print("Invalid numbers.")

if __name__ == "__main__":
    main()
