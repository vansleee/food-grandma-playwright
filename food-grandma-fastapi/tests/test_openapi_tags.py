from app.main import app


def test_openapi_operations_are_grouped_by_router_tag():
    schema = app.openapi()
    expected_order = ["restaurant", "customer", "driver", "auth", "test"]
    http_methods = {"get", "post", "put", "patch", "delete", "options", "head"}

    assert [tag["name"] for tag in schema["tags"]] == expected_order

    for path, path_item in schema["paths"].items():
        if path.startswith("/api/restaurant/"):
            expected_tag = "restaurant"
        elif path.startswith("/api/customer/"):
            expected_tag = "customer"
        elif path.startswith("/api/driver/"):
            expected_tag = "driver"
        elif path.startswith("/api/social/"):
            expected_tag = "auth"
        elif path.startswith("/api/test/"):
            expected_tag = "test"
        else:
            raise AssertionError(f"Undocumented API group for path: {path}")

        for method, operation in path_item.items():
            if method in http_methods:
                assert operation["tags"] == [expected_tag], f"{method.upper()} {path}"
