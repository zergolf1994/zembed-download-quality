if test -t 1; then # if terminal
    ncolors=$(which tput > /dev/null && tput colors) # supports color
    if test -n "$ncolors" && test $ncolors -ge 8; then
        termcols=$(tput cols)
        bold="$(tput bold)"
        underline="$(tput smul)"
        standout="$(tput smso)"
        normal="$(tput sgr0)"
        black="$(tput setaf 0)"
        red="$(tput setaf 1)"
        green="$(tput setaf 2)"
        yellow="$(tput setaf 3)"
        blue="$(tput setaf 4)"
        magenta="$(tput setaf 5)"
        cyan="$(tput setaf 6)"
        white="$(tput setaf 7)"
    fi
fi

if [[ ! ${1} ]]; then
    echo "${red}================================================================================${normal}"
    echo -e "  ${bold}${yellow}not slug${normal}"
    echo "${red}================================================================================${normal}"
    exit 1
fi
localhost="127.0.0.1"
data=$(curl -sLf "http://${localhost}/data?slug=${1}" | jq -r ".")
status=$(echo $data | jq -r ".status")

if [[ $status == "false" ]]; then
    echo "${red}================================================================================${normal}"
    echo -e "  ${bold}${yellow}${status}${normal}"
    echo "${red}================================================================================${normal}"
    exit 1
fi

quality=$(echo $data | jq ".quality | to_entries | .[].value"  --raw-output)
outPutPath=$(echo $data | jq ".outPutPath"  --raw-output)
cookie=$(echo $data | jq ".cookie"  --raw-output)
vdo=$(echo $data | jq ".vdo")
speed=20
for qua in $quality
do
    outPut=${outPutPath}/file_${qua}.mp4
    linkDownload=$(echo $vdo | jq -r ".file_${qua}")
    DownloadTXT="${outPutPath}/file_${qua}.txt"

    if [[ -f "$outPut" ]]; then
        rm -rf ${outPut}
    fi
    if [[ -f "$DownloadTXT" ]]; then
        rm -rf ${DownloadTXT}
    fi
    
    if [ "${cookie}" != "null" ]; then
        #curl "${linkDownload}" -H "cookie: ${cookie}" --output "${outPut}" -# >> ${DownloadTXT} 2>&1
        axel -H "Cookie: ${cookie}" -n ${speed} -o "${outPut}" "${linkDownload}" >> ${DownloadTXT} 2>&1
    else
        echo "e"
        #axel -n ${speed} -o "${outPut}" "${linkDownload}" >> ${DownloadTXT} 2>&1
    fi
    sleep 2
    curl -sS "http://127.0.0.1/remote?slug=${1}&quality=${qua}"
done
sleep 2
curl -sS "http://127.0.0.1/success?slug=${1}"