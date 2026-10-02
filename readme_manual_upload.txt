Great! Since you are doing a manual upload, here is exactly what you need to do:

1..Use your FTP client (like FileZilla) or cPanel File Manager to upload these files and folders to your public web root (public_html or htdocs):
index.html
css/
js/
images/
api/
vendor/ (This is the most important one to upload so the Excel library works!)

2..Create the secure data folder (stay-better-data) on your server outside of public_html as mentioned in your instructions.

3..Update the path in api/subscribe.php to point to the new folder on your server.

That's it! Let me know if you have any questions while setting it up on your live server.