# npm-post-event-source
npm-post-event-source

[![Node.js Build](https://github.com/YulerB/npm-post-event-source/actions/workflows/npm-build-test.yml/badge.svg)](https://github.com/YulerB/npm-post-event-source/actions/workflows/npm-build-test.yml)

```
import { DataModel } from "./data-model";
import { Observable} from "rxjs";
import {EventSourcePost} from "../src/event-source-post";

export class Service{
    public getData(dataFilter: string): Observable<DataModel>{
        return new Observable<DataModel>((observer) => {
            let url = 'api/getData';
            let eventSource = new EventSourcePost(url, {method: 'POST', timeout: 200000, body: dataFilter});
            eventSource.onmessage.subscribe((event) => {
                observer.next(JSON.parse(event.data));
            });
            eventSource.onerror.subscribe((error) => {
                eventSource.close();
                observer.complete();
            });
            eventSource.consume();
        });
    }
}
```
