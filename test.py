import requests
import json
import urllib.parse

# API endpoint
url = "https://www.whvx.net/search"

# Data as per API requirements
params = {
    'title': 'Castle',
    'releaseYear': '2009',
    'tmdbId': '1419',
    'imdbId': 'tt1219024',
    'type': 'show',
    'season': '1',
    'episode': '1'
}

# Convert the parameters to a JSON string and URL-encode them
encoded_params = urllib.parse.quote(json.dumps(params))

# Make the GET request with the encoded parameters
response = requests.get(url, params={'query': encoded_params})
# data = response.json()

# print(data)
# Output the response
# print(response.status_code)
print(response)
