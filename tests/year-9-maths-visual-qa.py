"""Local-only Year 9 V2.1 visual and interaction review; never submits the form."""

from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "qa" / "year9-v2-1"


class RouteHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.split("?", 1)[0] == "/year-9-maths":
            self.path = "/year-9-maths.html"
        elif self.path.split("?", 1)[0] == "/year-9-maths-request-received":
            self.path = "/year-9-maths-request-received.html"
        super().do_GET()

    def log_message(self, *_args):
        pass


def snapshot(page, name):
    page.screenshot(path=str(OUTPUT / name), animations="disabled")


def assert_cookie_controls(page):
    banner = page.locator("[data-cookie-banner]")
    accept = banner.locator("[data-cookie-accept]")
    reject = banner.locator("[data-cookie-reject]")
    settings = banner.locator("[data-cookie-settings-open]")
    assert banner.locator("h2").inner_text() == "Optional cookies"
    assert "We use optional cookies to measure advertising and improve enquiries. The site still works if you reject them." in banner.inner_text()
    assert banner.locator('a[href="/cookies.html"]').is_visible()
    assert accept.inner_text() == "Accept" and reject.inner_text() == "Reject"
    assert settings.inner_text() == "Cookie settings" and settings.is_visible()
    first, second, third = accept.bounding_box(), reject.bounding_box(), settings.bounding_box()
    actions = banner.locator(".cookie-banner-actions").bounding_box()
    assert abs(first["y"] - second["y"]) <= 1
    assert first["width"] < 110 and second["width"] < 110, "primary buttons should hug their labels"
    assert 6 <= second["x"] - (first["x"] + first["width"]) <= 16
    assert abs((first["x"] + second["x"] + second["width"]) / 2 - (actions["x"] + actions["width"] / 2)) <= 1
    assert abs(first["height"] - second["height"]) <= 1
    assert first["height"] >= 44 and second["height"] >= 44
    assert third["y"] >= first["y"] + first["height"]
    assert page.evaluate("""() => {
        const a = getComputedStyle(document.querySelector('[data-cookie-accept]'));
        const r = getComputedStyle(document.querySelector('[data-cookie-reject]'));
        const s = getComputedStyle(document.querySelector('[data-cookie-banner] [data-cookie-settings-open]'));
        const notice = getComputedStyle(document.querySelector('[data-cookie-banner] a[href="/cookies.html"]'));
        return a.backgroundColor === r.backgroundColor && a.color === r.color &&
          a.borderColor === r.borderColor && a.paddingLeft === r.paddingLeft &&
          a.paddingRight === r.paddingRight && a.paddingTop === r.paddingTop &&
          a.paddingBottom === r.paddingBottom && s.borderTopWidth === '0px' &&
          s.textDecorationLine.includes('underline') && notice.textDecorationLine.includes('underline');
    }""")


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    server = ThreadingHTTPServer(("127.0.0.1", 0), partial(RouteHandler, directory=str(ROOT)))
    Thread(target=server.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{server.server_port}"
    errors = []
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(channel="chrome", headless=True)
            for width in (360, 390, 430):
                context = browser.new_context(viewport={"width": width, "height": 844}, device_scale_factor=1, is_mobile=True, has_touch=True)
                context.route("https://**/*", lambda route: route.fulfill(status=200, body="", content_type="application/javascript"))
                page = context.new_page()
                page.on("pageerror", lambda error: errors.append(str(error)))
                page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
                response = page.goto(base + "/year-9-maths?utm_source=meta&utm_medium=paid_social&utm_campaign=meta2_y9_maths_oct26&utm_content=parent_proof")
                assert response.status == 200
                assert page.locator("h1").inner_text() == "Find the Maths gaps before GCSE pressure builds"
                assert page.locator("[data-cookie-banner]").is_visible()
                assert_cookie_controls(page)
                assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth"), f"horizontal overflow at {width}px"
                assert page.locator(".year9-featured-proof").bounding_box()["y"] < page.locator(".year9-difference").bounding_box()["y"]
                assert page.locator(".year9-difference").bounding_box()["y"] < page.locator(".year9-diagnostic").bounding_box()["y"]
                assert page.locator(".year9-programme-detail, .year9-team-section").count() == 0
                assert "£" not in page.locator("main").inner_text()
                page.wait_for_function("[...document.images].every(img => img.complete && img.naturalWidth > 0)")
                page.evaluate("window.scrollTo(0, 0)")
                if width == 390:
                    page.locator("[data-cookie-banner]").screenshot(path=str(OUTPUT / "03_mobile_cookie_panel.png"))
                    page.locator("[data-cookie-banner] [data-cookie-settings-open]").focus()
                    page.keyboard.press("Enter")
                    assert page.locator("[data-cookie-dialog-backdrop]").is_visible()
                    page.keyboard.press("Escape")
                    assert not page.locator("[data-cookie-dialog-backdrop]").is_visible()
                    page.locator("[data-cookie-reject]").click()
                    assert not page.locator("[data-cookie-banner]").is_visible()
                    page.reload()
                    assert not page.locator("[data-cookie-banner]").is_visible()
                    page.locator(".cookie-settings-trigger").click()
                    assert page.locator("[data-cookie-dialog-backdrop]").is_visible()
                    assert not page.locator("[data-cookie-marketing]").is_checked()
                    page.locator("[data-cookie-dialog-close]").click()
                    page.evaluate("window.scrollTo(0, 0)")
                    page.screenshot(path=str(OUTPUT / "04_mobile_hero_proof.png"), clip={"x": 0, "y": 0, "width": 390, "height": 950}, animations="disabled")
                    page.locator(".year9-difference").screenshot(path=str(OUTPUT / "05_mobile_difference.png"))
                    page.locator(".year9-diagnostic").screenshot(path=str(OUTPUT / "06a_mobile_diagnostic.png"))
                    page.locator(".year9-process").screenshot(path=str(OUTPUT / "06b_mobile_three_steps.png"))
                    page.locator("#year9-consultation").screenshot(path=str(OUTPUT / "07_mobile_form.png"))
                    assert page.locator("input[name='POTENTIALCF4']").get_attribute("type") == "hidden"
                    assert page.locator("input[name='POTENTIALCF4']").input_value() == "Year 9"
                    page.evaluate("window.scrollTo(0, 0)")
                    page.screenshot(path=str(OUTPUT / "09_mobile_full_page.png"), full_page=True, animations="disabled")
                    page.locator("#year9-main-concern").select_option("Other")
                    assert page.locator("#year9-parent-message-field").is_visible()
                    assert page.locator("#year9-parent-message").get_attribute("required") is not None
                    assert page.evaluate("window.checkMandatory985999000000548437()") is False
                    page.locator("#year9-consultation").screenshot(path=str(OUTPUT / "08_mobile_other.png"))
                    page.locator("#year9-main-concern").focus()
                    page.keyboard.press("Tab")
                    assert page.evaluate("document.activeElement.id") == "year9-parent-message"
                    page.locator("input[name='POTENTIALCF1']").fill("Test Parent")
                    page.locator("input[name='POTENTIALCF3']").fill("parent@example.invalid")
                    page.locator("input[name='POTENTIALCF2']").fill("07000000000")
                    page.locator("input[name='Potential Name']").fill("Test")
                    page.locator("input[name='Contacts.Last Name']").fill("Student")
                    page.locator("select[name='POTENTIALCF11']").select_option("Email")
                    page.locator("#year9-privacy-consent").check()
                    assert page.evaluate("window.checkMandatory985999000000548437()") is False, "Other text must be required"
                    page.locator("#year9-parent-message").fill("Repeated difficulty applying algebra in questions.")
                    assert page.evaluate("window.checkMandatory985999000000548437()") is True
                    notes = page.locator("#year9-crm-notes").input_value()
                    assert "Additional detail: Repeated difficulty applying algebra in questions." in notes
                    assert "marketing_platform=Meta" in notes and "utm_content=parent_proof" in notes
                    assert "landing_page=/year-9-maths" in notes
                    assert page.evaluate("new FormData(document.querySelector('.year9-form')).get('POTENTIALCF4')") == "Year 9"
                    assert page.evaluate("new FormData(document.querySelector('.year9-form')).get('Contacts.Last Name')") == "Student"
                    assert page.evaluate("new FormData(document.querySelector('.year9-form')).get('POTENTIALCF11')") == "Email"
                    page.locator(".cookie-settings-trigger").click()
                    page.locator("[data-cookie-marketing]").check()
                    page.locator("[data-cookie-save]").click()
                    page.reload()
                    assert not page.locator("[data-cookie-banner]").is_visible()
                    page.locator(".cookie-settings-trigger").click()
                    assert page.locator("[data-cookie-marketing]").is_checked()
                    page.locator("[data-cookie-dialog-close]").click()
                else:
                    snapshot(page, f"0{'1' if width == 360 else '2'}_mobile_{width}_fresh.png")
                    if width == 360:
                        page.locator("[data-cookie-accept]").click()
                        page.reload()
                        assert not page.locator("[data-cookie-banner]").is_visible()
                        page.locator(".cookie-settings-trigger").click()
                        assert page.locator("[data-cookie-marketing]").is_checked()
                    if width == 430:
                        page.locator("[data-cookie-reject]").click()
                        page.locator("input[name='POTENTIALCF1']").fill("Test Parent")
                        page.locator("input[name='POTENTIALCF3']").fill("parent@example.invalid")
                        page.locator("input[name='POTENTIALCF2']").fill("07000000000")
                        page.locator("input[name='Potential Name']").fill("Test")
                        page.locator("#year9-main-concern").select_option("Preparing for GCSE Maths")
                        page.locator("#year9-privacy-consent").check()
                        assert page.evaluate("window.checkMandatory985999000000548437()") is False, "surname and contact method remain required"
                        page.locator("input[name='Contacts.Last Name']").fill("Student")
                        assert page.evaluate("window.checkMandatory985999000000548437()") is False, "contact method remains required"
                        page.locator("select[name='POTENTIALCF11']").select_option("Email")
                        assert not page.locator("#year9-parent-message-field").is_visible()
                        assert page.evaluate("window.checkMandatory985999000000548437()") is True
                        assert "Main Maths concern: Preparing for GCSE Maths" in page.locator("#year9-crm-notes").input_value()
                        assert "Additional detail:" not in page.locator("#year9-crm-notes").input_value()
                        response = page.goto(base + "/year-9-maths-request-received?unexpected=value")
                        assert response.status == 200
                        assert page.locator("h1").inner_text() == "Thank you for your Year 9 Maths enquiry."
                        assert page.locator("form").count() == 0
                context.close()

            desktop = browser.new_context(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
            desktop.route("https://**/*", lambda route: route.fulfill(status=200, body="", content_type="application/javascript"))
            page = desktop.new_page()
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
            page.goto(base + "/year-9-maths")
            assert_cookie_controls(page)
            assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
            page.locator("[data-cookie-reject]").click()
            page.wait_for_function("[...document.images].every(img => img.complete && img.naturalWidth > 0)")
            page.evaluate("window.scrollTo(0, 0)")
            page.screenshot(path=str(OUTPUT / "10_desktop_overview.png"), full_page=True, animations="disabled")
            assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
            desktop.close()
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
    assert not errors, f"JavaScript errors: {errors}"
    print("PASS: local route, 360/390/430px layout, assets, pricing/gallery absence, consent choices/revisit, Bigin-safe fields, Other validation/keyboard, desktop overview")
    print(f"Screenshots: {OUTPUT}")


if __name__ == "__main__":
    main()
