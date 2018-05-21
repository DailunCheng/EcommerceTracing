import json
import subprocess
import requests
def getLatency(durationMilliSecond, containerName, hostIP):

    '''
    f = open("compromised.log", "r")
    if f.mode == 'r':
        contents = f.read()
    jsonResult=json.loads(contents)
    '''

    '''
    if not frontend: search for name and server type and get duration
    if frontend: search parentid==traceid, use root no parent for start time, all parentid == traceid, if only one, use that one
    with cs,cr. If multiple, use the latest one's client receive as end.
    '''



    numOfTrace = 0
    allTraceLatency = []
    a = containerName[:8]
    if containerName == 'frontend': # special work around for front end (first layer) tracing (aggregate frontend container)
        # get all service name
        URLService = "http://128.253.128.66:9411/api/v1/services"
        jsonResultServices = requests.get(URLService).json()
        numOfTrace = 0
        # print(json.dumps(jsonResultServices))
        for serviceName in jsonResultServices:
            if serviceName[:8] == "frontend":
                jsonResult, partTraceLatency = get_latency_frontend_workaround(durationMilliSecond, serviceName, hostIP)
                if len(partTraceLatency) != 0:
                    allTraceLatency += partTraceLatency
                    numOfTrace += len(jsonResult)
    elif containerName[:8]=="frontend": # special work around for front end (first layer) tracing (one specific service)

        jsonResult, allTraceLatency = get_latency_frontend_workaround(durationMilliSecond, containerName, hostIP)
        numOfTrace = len(jsonResult)
    else: # all other container will use the server send/receive duration directly
        URL = "http://128.253.128.66:9411/api/v1/traces?serviceName=" + containerName + "&lookback=" + str(
            durationMilliSecond) + "&limit=1000"
        jsonResult = requests.get(URL).json()
        # print(json.dumps(jsonResult))
        for trace in jsonResult:
            for span in trace:
                starttime = 0
                endtime = 0
                found = False
                if 'annotations' in span: # must contain ss,sr or cs,cr or both, root span of a container found
                    annotations = span['annotations']
                    for item in annotations: # record time difference if service name match in server annotation
                        if item['value']=='ss' or item['value']=='sr':
                            if item['endpoint']['serviceName'] != containerName: # name not match, check next span
                                break
                            else:
                                allTraceLatency.append(span['duration'])
                                break
        numOfTrace = len(jsonResult)

    assert numOfTrace <= len(allTraceLatency)
    if len(allTraceLatency)==0:
        return 0
    else:
        return sum(allTraceLatency) / float(len(allTraceLatency))


def get_latency_frontend_workaround(durationMilliSecond, containerName, hostIP):
    URL = "http://"+hostIP+":9411/api/v1/traces?serviceName=" + containerName + "&lookback=" + str(
        durationMilliSecond) + "&limit=1000"
    r = requests.get(URL)
    # print(r.status_code)
    jsonResult = r.json()
    # print(json.dumps(jsonResult))
    allTraceLatency = list()
    for trace in jsonResult:
        starttime = 0
        endtime = 0
        haveFrontEnd = False
        for span in trace:
            a = span['id'] != span['traceId']
            assert not ('parentId' not in span and span['id'] != span['traceId']), 'frontend trace not completed'
            if 'parentId' not in span and span['id'] == span['traceId']:  # always use local trace as starting time
                haveFrontEnd = True
                starttime = span['timestamp']
            elif span['parentId'] == span[
                'traceId']:  # find the span of direct request receiver containing client receive timestamp
                annotations = span['annotations']
                for item in annotations:  # find client receive time and set the largest one in the trace as end time
                    if item['value'] == 'cr':
                        endtime = max(item['timestamp'], endtime)
                        break
        if haveFrontEnd:
            allTraceLatency.append(endtime - starttime)
    return jsonResult, allTraceLatency

def main():
    print(getLatency(10000000,"frontend","128.253.128.66"))

if __name__== "__main__":
    main()
