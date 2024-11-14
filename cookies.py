import sqlite3
import os
import shutil
import json
from datetime import datetime


def export_firefox_cookies_to_json():
    firefox_profile = os.path.expanduser("~/.mozilla/firefox/kwd256nl.default-release/")
    cookies_file = os.path.join(firefox_profile, "cookies.sqlite")
    temp_file = "temp_cookies.sqlite"
    shutil.copy2(cookies_file, temp_file)
    conn = 0
    try:
        conn = sqlite3.connect(temp_file)
        cursor = conn.cursor()
        host = "midway-auth.amazon.com"

        cursor.execute(
            """
            SELECT host, name, value, path, expiry, isSecure, isHttpOnly 
            FROM moz_cookies 
            WHERE host LIKE ?
        """,
            ("%" + host + "%",),
        )

        cookies = cursor.fetchall()
        cookie_list = []

        if not cookies:
            print(f"No cookies found for host: {host}")
        else:
            print(f"Cookies found for host: {host}")
            for cookie in cookies:
                cookie_dict = {
                    "name": cookie[1],
                    "value": cookie[2],
                    "domain": cookie[0],
                    "path": cookie[3] or "/",
                    "expires": cookie[4],
                    "secure": bool(cookie[5]),
                    "httpOnly": bool(cookie[6]),
                }
                # Ensure the cookie has either a url or domain/path pair
                if not cookie_dict.get("domain"):
                    cookie_dict["url"] = f"https://{host}"
                cookie_list.append(cookie_dict)

        # Export to JSON file
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        json_filename = f"firefox_cookies_{timestamp}.json"
        with open(json_filename, "w") as json_file:
            json.dump(cookie_list, json_file, indent=2)

        print(f"Cookies exported to {json_filename}")

    except sqlite3.Error as e:
        print(f"An error occurred: {e}")

    finally:
        if conn:
            conn.close()
        os.remove(temp_file)


if __name__ == "__main__":
    export_firefox_cookies_to_json()
