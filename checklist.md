# Akuli's code review checklist

Please check these things before requesting a Python code review from Akuli:
- You are not creating new `self.blah` attributes outside the `__init__` method
- If you defined a new thing (function, method, attribute, ...), you are actually using it for something
- Variables defined inside a loop are not used outside the loop (unless you e.g. use `break`)
- If the code contains a bug, you have tried:
    - Reading the error message, if any (make sure you know what it means, word by word)
    - Adding prints
    - Deleting other code, so that you are left with a smaller program containing the bug
    - Thinking about whether you have had a similar problem in the past, maybe in a different project
    - If a library is involved, tried to read official documentation about the relevant functions, methods or classes

Ask for help if you have trouble following this list.
