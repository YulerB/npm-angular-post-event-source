import { EventSourceInit } from "./event-source-init";
import { EventSourcePostOptions } from "./event-source-post-options";

export class EventSourcePost extends EventTarget {
	public onopen = new Event('onopen');
	public onmessage = new Event('onmessage');
	public onclose = new Event('onclose');
	public onerror = new Event('onerror');
	private xhr = new XMLHttpRequest();
	public readyState: number = 1;
	public type = 'data';

	constructor(private url: string, private opts:EventSourcePostOptions){
		super();
	}

	addOnErrorListener(callback: (evt: CustomEvent<ErrorEvent>) => void): void {
		return this.addEventListener('onerror', callback as (evt: Event) => void);
	}

	dispatchError(event: ErrorEvent): boolean {
		return this.dispatchEvent(new CustomEvent('onerror', { detail: event }));
	}

	removeOnErrorListener(callback: (evt: CustomEvent<ErrorEvent>) => void): void {
		return this.removeEventListener('onerror', callback as (evt: Event) => void);
	}

	addOnCloseListener(callback: (evt: CustomEvent<Event>) => void): void {
		return this.addEventListener('onclose', callback as (evt: Event) => void);
	}

	dispatchClose(event: Event): boolean {
		return this.dispatchEvent(new CustomEvent('onclose', { detail: event }));
	}

	removeOnCloseListener(callback: (evt: CustomEvent<Event>) => void): void {
		return this.removeEventListener('onclose', callback as (evt: Event) => void);
	}

	addOnMessageListener(callback: (evt: CustomEvent<MessageEvent>) => void): void {
		return this.addEventListener('onmessage', callback as (evt: Event) => void);
	}

	dispatchMessage(event: MessageEvent): boolean {
		return this.dispatchEvent(new CustomEvent('onmessage', { detail: event }));
	}

	removeOnMessageListener(callback: (evt: CustomEvent<MessageEvent>) => void): void {
		return this.removeEventListener('onmessage', callback as (evt: Event) => void);
	}

	addOnOpenListener(callback: (evt: CustomEvent<Event>) => void): void {
		return this.addEventListener('onopen', callback as (evt: Event) => void);
	}

	dispatchOpen(event: Event): boolean {
		return this.dispatchEvent(new CustomEvent('onopen', { detail: event }));
	}

	removeOnOpenListener(callback: (evt: CustomEvent<Event>) => void): void {
		return this.removeEventListener('onopen', callback as (evt: Event) => void);
	}

	public consume(){
		let ongoing = false;
		let start = 0;
		this.xhr.onprogress = () => {
			if(!ongoing){
				ongoing = true;
				this.dispatchOpen(new Event('open', {
					status: this.xhr.status,
					headers:  this.xhr.getAllResponseHeaders(),
					url: this.xhr.responseURL,
				} as EventSourceInit));
			}

			let i: number;
			let chunk : string;
			while((i = this.xhr.responseText.indexOf('\n\n', start)) >= 0){
				chunk = this.xhr.responseText.slice(start, i);
				start = i + 2;
				if(chunk.length){
					this.sseevent(chunk);
				}
			}
		};
		this.xhr.onloadend = _ => {
			this.readyState = 0;
			this.dispatchError(new ErrorEvent('close'));
		};
		if(this.opts.timeout){
			this.xhr.timeout = this.opts.timeout;
		}
		this.xhr.ontimeout = _ => {
			this.readyState = 0;
			this.dispatchError(new ErrorEvent('timeout'));
		};
		this.xhr.onerror = _ => {
			this.readyState = 0;
			this.dispatchError(new ErrorEvent('error'));
		};
		this.xhr.onabort = _ => {
			this.readyState = 0;
			this.dispatchError(new ErrorEvent('abort'));
		};

		this.xhr.open(this.opts.method || 'GET', this.url, true);

		this.xhr.setRequestHeader('accept', 'text/event-stream');
		if(this.opts.headers){
			for(let k in this.opts.headers){
				this.xhr.setRequestHeader(k, this.opts.headers.get(k) ?? '');
			}
		}

		this.xhr.send(this.opts.body);
	}

	public close(){
		try{
			this.xhr.abort();
		}
		catch(e){

		}
		this.dispatchClose(new Event('close'));
	}

	private sseevent(message: string): void {
		
		let start = 0;
		if(message.startsWith(this.type + ':')) {
			start = message.indexOf('\n');
		}
		start = message.indexOf(':', start) + 1;
		let data = message.slice(start, message.length);
		this.dispatchMessage(new MessageEvent(this.type, {data: data}));
	}
}
