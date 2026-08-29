class AbortError extends Error {
    constructor(message){
        super(message) = message;
        this.name = "AbortError";
    }
}

export default AbortError;