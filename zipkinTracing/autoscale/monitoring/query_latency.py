import json
import requests
def getContainerLatency(container_name, jsonResult):
    allTraceLatency = list()
    for trace in jsonResult:
        for span in trace:
            if 'kind' in span and span['kind']=='SERVER' and span['localEndpoint']['serviceName']==container_name:
                allTraceLatency.append(span['duration'])

    if len(allTraceLatency)==0:
        return 0
    else:
        print(sum(allTraceLatency))
        return sum(allTraceLatency) / int(len(allTraceLatency))

def getFrontendServiceLatency(frontend_service_name, jsonResult):
    allTraceLatency = list()
    for trace in jsonResult:
        for span in trace:
            if 'kind' in span and span['kind']=='CLIENT' and span['localEndpoint']['serviceName']==frontend_service_name:
                allTraceLatency.append(span['duration'])
    if len(allTraceLatency)==0:
        return 0
    else:
        return sum(allTraceLatency) / int(len(allTraceLatency))

def getTracingFromZipkin(hostIP, container_name, durationMilliSecond):
    URL = "http://" + hostIP + ":9411/api/v2/traces?serviceName=" + container_name + "&lookback=" + str(
        durationMilliSecond) + "&limit=1000"
    jsonResult = requests.get(URL).json()
    # print(json.dumps(jsonResult))
    return jsonResult


def queryLatency(hostIP, name, durationMilliSecond, is_container):
    assert is_container == True or is_container == False, 'is_container is a boolean'
    jsonResult = getTracingFromZipkin(hostIP, name, durationMilliSecond)
    if is_container:
        latency_average = getContainerLatency(name, jsonResult)
    else:
        latency_average = getFrontendServiceLatency(name, jsonResult)
    return latency_average

def main():
    print(queryLatency("128.253.128.66", "orders", 10000000, True))
    print(queryLatency("128.253.128.66", "frontend_wishlist_update", 10000000, False))
    print(queryLatency("128.253.128.66", "frontend", 10000000, True))


if __name__== "__main__":
    main()
