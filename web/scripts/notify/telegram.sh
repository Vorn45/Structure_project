#!/bin/bash


# Alert function
function alert(){
    DATE="$(date '+%Y-%m-%d')"
    TIME="$(date '+%I:%M:%S')"
    MSG=$(git log -n 1 --pretty=format:"<b>📝 MESSAGE</b>: %s")
    COMMIT_LINK=$(git log -1 --pretty=format:%h)
    L="⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯"
    Server="<b>🌐  Server</b>: Camcyber-UAT"
    COMMITER=$(git log -n 1 --pretty=format:"<b>👤 COMMITER</b>: %cN %n%0A<b>📅 DATE</b>: $DATE %n%0A<b>⏰ TIME</b>: $TIME")


    MSG="${L}%0A%0A<b>🖥 PROJECT</b>: ${PROJECT_NAME}%0A%0A<b>🏷 APPLICATION</b>: WEB%0A%0A<b>🚀DEPLOYMENT STATUS</b>: $1 %0A%0A<b>🎯 ENV</b>: UAT%0A%0A${L}%0A$COMMITER%0A%0A$MSG%0A%0A<b>🔗 LINK TO SEE COMMIT</b>: https://gitlab.camcyber.com/system/sms/web/-/commit/$COMMIT_LINK%0A%0A${L}%0A%0A${Server}%0A%0A${L}"
    curl -s -X POST https://api.telegram.org/bot${BOT_TOKEN}/sendMessage -d chat_id=${CHAT_ID} -d text="$MSG" -d parse_mode="HTML"
}

# Main conditional handling
if [[ "$1" == "success" ]];
then
    alert "Success 🟢" 
else
    alert "Fail 🔴"
fi
