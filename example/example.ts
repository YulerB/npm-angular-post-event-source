import { DataModel } from "./data-model";

export class Service{
    public getData(dataFilter: string): Observable<DataModel>{
        return new Observable<DataModel>((observer) => {
            let url = 'api/getData';
            let eventSource = new EventSource2(url, {method: 'POST', timeout: 200000, body: dataFilter});
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