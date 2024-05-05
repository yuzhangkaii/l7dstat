#!/usr/bin/bash
truncate -s 0 log.txt
while true;do
# 定义抓包时长（单位：秒）
DURATION=$1



capture_command="tshark -n -t ad -Y 'http.host == hostip' -T fields -e frame.time -e ip.src -e http.host -e http.request.uri -l  > log.txt"



    eval "$capture_command" &
    pid=$!

    # 等待指定的抓包时长后，结束tshark进程
    sleep $DURATION
    echo "Stopping current tshark capture."
    kill $pid

    # 确保tshark进程已终止
    wait $pid 2>/dev/null
      truncate -s 0 log.txt
done