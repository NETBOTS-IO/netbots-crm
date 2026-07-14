@echo off
title MongoDB Local Server
echo Starting local MongoDB server...
"C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe" --dbpath "e:\products\netbots-crm\mongodb_data" --port 27017
pause
