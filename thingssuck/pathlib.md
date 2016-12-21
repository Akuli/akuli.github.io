# Why pathlib sucks

1. The zen says:

    > Simple is better than complex.
    > Complex is better than complicated.

    Let's get this straight: paths are best represented by strings.
    Operating systems and programming languages have represented paths
    with strings for dozens of years, but now pathlib comes in and says
    that paths should not be represented as strings because it's too
    simple. Path objects are more complex than Python's strings and people
    are not familiar with them. Representing paths with strings is much
    simpler. Many things expect a string instead of a Path object, so if
    we use Path objects we need to convert them to strings at some point
    anyway. So instead of `os.path.join(a, b)` we now have
    `str(pathlib.Path(a) / b)`. Great!

2. The zen says:

    > Explicit is better than implicit.

    Pathlib's paths behave like strings when they are printed.

    ```py
    >>> print(pathlib.Path("i look like a string"))
    i look like a string
    ```

    Printing things is not the best possible way to debug, but it's still
    a very common way. pathlib's paths define a custom `__str__` that makes
    them difficult to distinguish from regular Python strings when they
    are printed. A `to_string()` method or an `as_string` property instead of
    `__str__` magic would make Path objects much easier to work with.

3. The zen says:

    > Beautiful is better than ugly.
    > Readability counts.

    Dividing by a string is awfully ugly and unreadable. We're supposed to
    divide things by numbers, not by strings! We might as well replace
    explicit methods by abusing operators everywhere else also. For
    example, if we can join paths by dividing, why not to join everything
    by dividing? Instead of `','.join(things)` we would do `',' / things`.
    That's readable, beatiful and explicit, right? No, it's not! Paths
    should be joined, not divided. We're talking about Python, not Perl.

    ```py
    >>> print(pathlib.Path('Yet another pathlib hacker,'))
    Yet another pathlib hacker,
    ```

4. The zen says:

    > Errors should never pass silently.

    Path objects have a parent property that does exactly what the zen
    recommends against. It silences errors. Again, details like this can
    make debugging a real hell.

    ```py
    >>> import pathlib
    >>> stuff = pathlib.Path('stuff')
    >>> stuff
    PosixPath('stuff')
    >>> stuff.parent
    PosixPath('.')
    >>> stuff.parent.parent    # WTF?
    PosixPath('.')
    >>>
    ```

5. Pathlib fanboys say:

    > But big libraries need Path objects!

    Large libraries like twisted implement their own Path objects.
    But this doesn't mean that there needs to be one 1500-line module
    that replaces them all, and this definitely doesn't mean that
    `os.path` is some low-level, deprecated crap that nobody uses.
    [The pathlib documentation](https://docs.python.org/3/library/pathlib.html)
    really says, "For low-level path  manipulation on strings, you can
    also use the os.path module." Yesterday I was writing a C program
    and I checked if a string ended with a slash, and if it did I set
    that byte to 0. That's low-level, working with strings using
    Python's `os.path` is high-level.

Overall, pathlib is an awful library that somebody has written because he
didn't have anything else to do and he thought that python's zen sucks and
python needs to be more complicated. Pathlib turns simple, explicit, readable
and beatiful path management with os.path into a complicated, implicit,
unreadable and ugly hell that's awful to debug. Pathlib should be deprecated,
its use should be strongly discouraged and it should be removed from the
standard library immediately.
