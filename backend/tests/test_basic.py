import json


def test_home_route(client):
    resp = client.get('/')
    assert resp.status_code == 200
    assert b'MUN Buddy Backend' in resp.data
