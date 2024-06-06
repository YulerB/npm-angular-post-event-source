import { EventEmitter } from '@angular/core';

import { EventSourceInit } from "./event-source-init";
import { EventSourcePostOptions } from "./event-source-post-options";

export class EventSourcePost{
	public onopen = new EventEmitter<Event>();
	public onmessage = new EventEmitter<MessageEvent>();
	public onclose = new EventEmitter<void>();
	public onerror = new EventEmitter<ErrorEvent>();
	private xhr = new XMLHttpRequest();
	public readyState: number = 1;
	public type = 'data';
	private sseevent(message: string): MessageEvent {
		
		let start = 0;
		if(message.startsWith(this.type + ':')) {
			start = message.indexOf('\n');
		}
		start = message.indexOf(':', start) + 1;
		let data = message.slice(start, message.length);
		return new MessageEvent(this.type, {data: data});
	}
	constructor(private url: string, private opts:EventSourcePostOptions){

	}
	public consume(){
		let ongoing = false;
		let start = 0;
		this.xhr.onprogress = () => {
			if(!ongoing){
				ongoing = true;
				this.onopen.emit(new Event('open', {
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
					this.onmessage.emit(this.sseevent(chunk));
				}
			}
		};
		this.xhr.onloadend = _ => {
			this.readyState = 0;
			this.onerror.emit(new ErrorEvent('close'));
		};
		if(this.opts.timeout){
			this.xhr.timeout = this.opts.timeout;
		}
		this.xhr.ontimeout = _ => {
			this.readyState = 0;
			this.onerror.emit(new ErrorEvent('timeout'));
		};
		this.xhr.onerror = _ => {
			this.readyState = 0;
			this.onerror.emit(new ErrorEvent('error'));
		};
		this.xhr.onabort = _ => {
			this.readyState = 0;
			this.onerror.emit(new ErrorEvent('abort'));
		};

		this.xhr.open(this.opts.method || 'GET', this.url, true);

		if(this.opts.headers){
			this.xhr.setRequestHeader('accept', 'text/event-stream');
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
		this.onclose.emit();
	}
}
