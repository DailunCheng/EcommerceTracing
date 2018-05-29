import json
import subprocess
def getLatency(durationMilliSecond, containerName, hostIP):

    URL = "\"http://"+hostIP+":9411/api/v2/traces?serviceName="+containerName+"&lookback="+str(durationMilliSecond)+"&limit=10000\""
    response = subprocess.check_output("curl -X GET " + URL +" -H \"accept: application/json\"" , shell = True)

    '''
    f = open("complex.log", "r")
    if f.mode == 'r':
        contents = f.read()
    jsonResult=json.loads(contents)
    '''
    jsonResult=json.loads(response)
    numOfTrace = len(jsonResult)
    serverList = []
    clientList = []
    allTraceLatency = []
    for trace in jsonResult:
        for span in trace:
            if 'kind' in span and span['kind']=='SERVER' and span['localEndpoint']['serviceName']==containerName:
                serverList.append(span)
                allTraceLatency.append(span['duration'])
            if 'kind' in span and span['kind']=='CLIENT' and span['localEndpoint']['serviceName']==containerName:
                clientList.append(span)
                try:
                    allTraceLatency.append(span['duration'])
                except:
                    print(json.dumps(span))
    # check server condition (the parent is a different container)
    for serverSpan in serverList:
        if 'parentId' not in serverSpan: # unimplemented frontend
            pass
        else:
            parentspanId = serverSpan['parentId']
            traceId = serverSpan['traceId']
            for trace in jsonResult:
                if trace[0]['traceId']==traceId:
                    for span in trace:
                        if span['id'] == parentspanId:
                            assert span['localEndpoint']['serviceName']!=serverSpan['localEndpoint']['serviceName']

    # check client condition (client is the root trace)
    for clientSpan in clientList:
        assert 'parentid' not in clientSpan

    assert len(serverList)+len(clientList), "no relavent latency info for this container in this trace"
    return sum(allTraceLatency)/float(len(serverList)+len(clientList))



def main():
    print(getLatency(100000000,"orders","128.253.128.66"))

if __name__== "__main__":
    main()

