import json
import subprocess
import requests

def getLatency(durationMilliSecond, containerName, hostIP):

    URL = "http://"+hostIP+":9411/api/v2/traces?serviceName="+containerName+"&lookback="+str(durationMilliSecond)+"&limit=10000"

    # r = requests.get(URL)
    # data = r.json()
    # print(data)

    response = subprocess.check_output("curl -X GET " + URL +" -H \"accept: application/json\"" , shell = True)
    jsonResult=json.loads(response)
    print(jsonResult)
    numOfTrace = len(jsonResult)
    allTraceLatency = []
    for i in range(numOfTrace):
        latency = jsonResult[i][-1]["duration"]
        allTraceLatency.append(latency)
    return sum(allTraceLatency)/float(numOfTrace)



def main():
    print(getLatency(1000000,"user","128.253.128.66"))

if __name__== "__main__":
    main()
