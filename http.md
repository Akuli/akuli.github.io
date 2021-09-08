# Akuli's guide to HTTP

When I was learning Python's `requests` library, I had no idea what I was doing.
On this page I will show you how HTTP works,
and I think knowing this helps a **lot** with using a library like `requests`.


## HTTP requests: what your browser sends to websites

A web server is a program where the browser connects when you go to a website.
By "connects", I mean that the browser creates a TCP connection to the server
and then proceeds to send data over the TCP connection.

A TCP connection is a way for two computers to send data to each other:
a single TCP connection between computers A and B can be used to send data from A to B,
or from B to A.
To estabilish the connection, one computer has to listen for connections
and the other has to connect to it.

To see what data your browser sends, let's first make the computer listen for incoming TCP connections
and just print anything it receives to the terminal.
All this can be done conveniently with one terminal command:

    nc -lp 12345

Here:
- `nc` is short for netcat, a program that does many things related to TCP connections.
- `-l` means "listen", as we want this command to act as a HTTP server.
- `-p 12345` specifies that netcat listens on port 12345.
    When connecting to the server, we will need to specify the same port number.
    The idea is that you can have many server programs running on the same computer,
    each with a different port, and they won't conflict with each other.

If you use Windows or you don't have netcat for some other reason,
you can use the following Python program instead.
It does the same thing (or at least it is close enough for our purposes).

```python
import socket

server_socket = socket.socket()
server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, True)
server_socket.bind(('localhost', 12345))
server_socket.listen(1)
client_connection = server_socket.accept()[0]
print(client_connection.recv(10000))
```

With the Python program or the netcat command running, go to `http://localhost:12345` with your web browser.
Here `localhost` is a host name, just like `github.com` for example,
although it is a bit special since it refers to the current computer.
The `:12345` part specifies that port 12345 should be used.
If you don't specify it, your browser will attempt to use port 80,
which is the default port for HTTP.
Most operating systems don't let a non-admin user listen to port 80,
which is why we are using a custom port number 12345 instead.

You should see something like this printed on terminal:

```
GET / HTTP/1.1
Host: localhost:12345
Connection: keep-alive
Cache-Control: max-age=0
sec-ch-ua: " Not A;Brand";v="99", "Chromium";v="90"
sec-ch-ua-mobile: ?0
Upgrade-Insecure-Requests: 1
User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9
Sec-Fetch-Site: none
Sec-Fetch-Mode: navigate
Sec-Fetch-User: ?1
Sec-Fetch-Dest: document
Accept-Encoding: gzip, deflate, br
Accept-Language: en-US,en;q=0.9,fi;q=0.8,sv;q=0.7,pt;q=0.6,it;q=0.5,zh-CN;q=0.4,zh;q=0.3

```

This is a **HTTP request**.
It is what the browser sends into a TCP socket whenever it connects to a website.

The output contains 3 distinct parts:
- The first line `GET / HTTP/1.1`. It consists of 3 space-separated parts.
    1. The first part is always `GET` when you are opening a page with the web browser,
        but it can also be e.g. `POST` or `PUT`.
        We will talk more about this below.
    2. The second part is taken directly from the URL.
        For example, if you restart the server and go to `http://localhost:12345/foo/bar`,
        the second part will be `/foo/bar` instead of `/`.
    3. The third part is always `HTTP/1.1`.
- After the first line, there are header lines, which look like `Name: value`.
- After the headers, there is a blank line to indicate where the headers end, and then the body.
    As is typical for GET requests, the body is empty, so the request ends with a blank line.

Every HTTP request has this structure.

If you came here because you want to learn to use a library that does HTTP requests,
also try connecting to the server with that.
For example, `requests.get("http://localhost:12345/")` in Python sends the following HTTP request.
It has the exact same structure, but different headers.

```
GET / HTTP/1.1
Host: localhost:12345
User-Agent: python-requests/2.25.1
Accept-Encoding: gzip, deflate
Accept: */*
Connection: keep-alive

```


## HTTP responses: what websites send to your browser

When you go to `http://localhost:12345` with our dumb server (Python script or netcat command)
running, the browser hangs.
This is because the server doesn't send a response to the browser,
telling what it should display on the page.

To get an idea of what responses look like, let's do a request to `http://example.com/`.
We will use port 80 instead of a custom port
It is a very simple website that just displays a message when you visit it with a browser.
Let's construct the HTTP request:
- A `GET` request to `http://example.com/`, so the first line is `GET / HTTP/1.1`
- We need to send one header, `Host: example.com`. We will soon talk about what happens if you send no headers.
- We will send an empty body, as is typical in `GET` requests.

If you have netcat, run `nc example.com 80` and type the HTTP request into it while running:

```
GET / HTTP/1.1
Host: example.com

```

Note that you need to end the request with a blank line, by pressing Enter twice,
because the body is empty.

If you don't have netcat, use this Python script instead:

```python
import socket

sock = socket.socket()
sock.connect(('example.com', 80))
sock.send(b'GET / HTTP/1.1\r\n')
sock.send(b'Host: example.com\r\n')
sock.send(b'\r\n')
print(sock.recv(10000).decode('utf-8'))
```

You should get a response that looks like this:

```
HTTP/1.1 200 OK
Age: 469267
Cache-Control: max-age=604800
Content-Type: text/html; charset=UTF-8
Date: Wed, 08 Sep 2021 17:41:15 GMT
Etag: "3147526947+gzip+ident"
Expires: Wed, 15 Sep 2021 17:41:15 GMT
Last-Modified: Thu, 17 Oct 2019 07:18:26 GMT
Server: ECS (bsa/EB13)
Vary: Accept-Encoding
X-Cache: HIT
Content-Length: 1256

<!doctype html>
<html>
<head>
    <title>Example Domain</title>

    <meta charset="utf-8" />
    <meta http-equiv="Content-type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type="text/css">
    body {
        background-color: #f0f0f2;
        margin: 0;
        padding: 0;
        font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", "Open Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
        
    }
    div {
        width: 600px;
        margin: 5em auto;
        padding: 2em;
        background-color: #fdfdff;
        border-radius: 0.5em;
        box-shadow: 2px 3px 7px 2px rgba(0,0,0,0.02);
    }
    a:link, a:visited {
        color: #38488f;
        text-decoration: none;
    }
    @media (max-width: 700px) {
        div {
            margin: 0 auto;
            width: auto;
        }
    }
    </style>    
</head>

<body>
<div>
    <h1>Example Domain</h1>
    <p>This domain is for use in illustrative examples in documents. You may use this
    domain in literature without prior coordination or asking for permission.</p>
    <p><a href="https://www.iana.org/domains/example">More information...</a></p>
</div>
</body>
</html>
```

The first line of a HTTP response again consists of 3 parts,
but these are not the same 3 parts as for a request:

1. The first part is always `HTTP/1.1`.
2. The second part is a status code. A couple most common status codes are
    200, which means OK, and 404, which means not found.
3. After the status code, there's a short description of what the status code means,
    such as `OK` in this case.
    It is redundant, because the status code itself contains the same information,
    but maybe the intent is that you don't have to google what a status code means.

The rest of the response has a similar structure:
it has headers, then a blank line, and then the body.

In this case, the body is HTML, which is what the browser shows.
If you want to experiment more with it,
you can copy/paste the HTML code into a new file and then open it in the browser
(by e.g. double-clicking it).
I won't explain what each part of the HTML or the CSS inside the HTML does,
because I want to keep the focus of this guide on HTTP.

To see more examples of HTTP responses, you can try a few different things with `example.com`.
- What happens if you don't send the `Host: example.com` header?
- What happens if the first line is `GET /asdfasdf HTTP/1.1` instead of `GET / HTTP/1.1`?
    (Most sites sent a different body in this case, but example.com doesn't for whatever reason.
    The status code is not same as for `GET / HTTP/1.1` though.)


## HTTPS = HTTP + SSL + different default port

TODO


## HTTP POST requests: what the "Submit" button does

TODO


## User-Agent header

TODO


## Form encoding vs JSON vs headers vs extending URL

TODO
