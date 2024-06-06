import { Observable} from "rxjs";

import { DataModel } from "./data-model";
import {EventSourcePost} from "../src/event-source-post";

export class Service{
    public getData(dataFilter: string): Observable<DataModel>{
        return new Observable<DataModel>((observer) => {
            let url = 'api/getData';
            const messageListener = (event: CustomEvent<MessageEvent>) => {
                observer.next(JSON.parse(event.detail.data));
            };
            const errorListener = (error: CustomEvent<ErrorEvent>) => {
                eventSource.close();
                observer.complete();
            };

            const closeListener = (close: Event)=>{
                eventSource.removeOnMessageListener(messageListener);
                eventSource.removeOnErrorListener(errorListener);
                eventSource.addOnCloseListener(closeListener);
            };

            let eventSource = new EventSourcePost(url, {method: 'POST', timeout: 200000, body: dataFilter});
            eventSource.addOnMessageListener(messageListener);
            eventSource.addOnErrorListener(errorListener);
            eventSource.addOnCloseListener(closeListener);

            eventSource.consume();
        });
    }
}