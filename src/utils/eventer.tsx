class Event {
    private static instance: Event;
    private eventDictionary: {[key: string]: Array<Function | undefined>} = {};

    public static getInstance() {
        if(!this.instance) {
            this.instance = new Event();
        }
        return this.instance;
    }

    constructor() {
        if (!Event.instance) {
            this.eventDictionary = {};
            Event.instance = this;
            
            // Add to whole window
            (window as any).Eventer = this;
        }
        return Event.instance; 
    }

    /**
     * EventListener for adding event
     * @param {string} eventName 
     * @param {Function} callback 
     */
    addEventListener(eventName: string, callback: Function | undefined) {
        // Find if eventName already exists
        if (!(eventName in this.eventDictionary)) {
            this.eventDictionary[eventName] = [];
        }
        
        // Push the callback function into list
        this.eventDictionary[eventName].push(callback);
    }

    /**
     * Remove the listener given a specific event and callback function
     * @param {string} eventName 
     * @param {Function | undefined} callback 
     * @returns 
     */
    removeEventListener(eventName: string, callback: Function | undefined) {
        // Throw Error when not find the event
        if (!(eventName in this.eventDictionary)) {
            return new Error('Event Not Registered');
        }

        // Just remove the specific callback function if callback given
        if (!!callback) {
            const currentEventList = this.eventDictionary[eventName];
            const callbackIndex = currentEventList.findIndex(savedCallbackFunction => 
                savedCallbackFunction === callback
            );

            // Raise error if callback function not found
            if (callbackIndex === -1 || callbackIndex === undefined) {
                return new Error('Callback function not found');
            }

            // Remove the callback function
            currentEventList.splice(callbackIndex, 1);
            
            // Remove this event if event list is empty 
            if (currentEventList.length === 0) {
                delete this.eventDictionary[eventName];
            }
        } else {
            // Directly delete this event
            delete this.eventDictionary[eventName];
        }
    }

    /**
     * Event disptacher, trigger the related event
     * @param {string} eventName 
     * @param  {...any} args 
     */
    dispatchEvent(eventName: string, ...args: any) {
        // Throw Error when not find the event
        if (!(eventName in this.eventDictionary)) {
            return new Error('Event Not Registered');
        }

        // Iterate for trigger
        this.eventDictionary[eventName].forEach((callback: Function | undefined) => {
            if (callback == undefined) {
                return;
            }

            callback(...args);
        })
    }
}

export const Eventer = Event.getInstance();