#!/bin/bash

# alert function
function alert(){
    DATE="$(date '+%Y-%m-%d')"
    TIME="$(date '+%I:%M:%S')"
    MSG=$(git log -n 1 --pretty=format:"<b>MESSAGE</b>: %s")
    L="------------------------------------------------------"
    Server="<b>Server</b>: Camcyber-development"
    COMMITER=$(git log -n 1 --pretty=format:"<b>COMMITER</b>: %cN %n<b>DATE</b>: $DATE %n<b>TIME</b>: $TIME")
    MSG="${L}%0A<b>PROJECT</b>: ${PROJECT_NAME}%0A<b>APPLICATION</b>: API%0A<b>STATUS</b>: $1%0A<b>ENV</b>: Development%0A${L}%0A$COMMITER%0A$MSG%0A${L}%0A${Server}%0A${L}"
    curl -s -X POST https://api.telegram.org/bot${BOT_TOKEN}/sendMessage -d chat_id=${CHAT_ID} -d text="$MSG" -d parse_mode="HTML"

}

# $1 is the first parameters the passed from gitlab CICD.
# CI_JOB_STATUS will return fail or success when the job failed or succeed.
# if commpared string match it will call function alert.

if [[ "$1" == "Success" ]];
then
    # call alert function and pass parameter that we retrived from gitlab predefined varaible.
    alert $1
else
    # if fail $1 return fail message then we pass parameter to display status success or fail. 
    alert $1
fi





# HASH=$(git log -n 1 |grep commit)
# AUTHOR=$(git show $HASH | grep Author)
# # MESSAGE=$(git show -s --format=%s)


# MSG="<b>STAGE</b>: SDF API%0A<b>STATUS</b>: Success%0A${Log}"


# if [ -z "${Log}" ]; then
#     echo "String is empty"
#     else
    
# fi
