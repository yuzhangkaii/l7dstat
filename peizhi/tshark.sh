#!/usr/bin/bash
truncate -s 0 log.txt
while true;do
# 定义抓包时长（单位：秒）
DURATION=$1




tshark_pid=$(nohup tshark -n -t ad -Y 'http.host == hostip' -T fields -e frame.time -e ip.src -e http.host -e http.request.uri -l  > log.txt& echo $!)
    # 等待指定的抓包时长后，结束tshark进程
    sleep $DURATION
    echo "Stopping current tshark capture."
    kill $tshark_pid

    # 确保tshark进程已终止
    wait $pid 2>/dev/null
      truncate -s 0 log.txt
done
