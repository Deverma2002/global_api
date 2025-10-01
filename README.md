## This project is a standalone project 
# global_api
https://asia-south1-ads-ai-101.cloudfunctions.net/global_api/api
## This Project API is used in Mobile (SMS) OTP verification in https://nissanmotor.web.app/ project
https://github.com/Rescale-Technologies-Private-Limited/nissan_ui


Steps to get the proxy credentials

1. use the post API to to get the authentication token

    curl -X POST   https://asia-south1-ads-ai-101.cloudfunctions.net/global_api/api/login   -H "Content-Type: application/json"   -d '{
    "clientId": "admin",
    "clientSecret": "admin123"
  }'

 2. use the get API with the token recieved from above
    
    curl -X GET   https://asia-south1-ads-ai-101.cloudfunctions.net/global_api/api/proxy   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGllbnRJZCI6InJlc2NhbGUuYWRtaW4iLCJpYXQiOjE3NTc1MDczMzEsImV4cCI6MTc1NzUxMDkzMX0.kmLAGQtdTDtzhANBe5W3arg0INYHQvisn5vSI52xOaQ"# global_api
# global_api
