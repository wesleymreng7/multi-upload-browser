const ObjectTranform = {
    headerLine: true,
    keys: [],
    tailChunk: '',

    start() {
        this.decoder = new TextDecoder('utf-8');
    },

    transform(chunk, controller) {
        const stringChunks = this.decoder.decode(chunk, { stream: true })
        const lines = stringChunks.split('\n')

        for (const line of lines) {
            const lineString = (this.tailChunk + line)
            let values = lineString.split(',')

            if (this.headerLine) {
                this.keys = values
                this.headerLine = false
                continue
            }


            if (values.length !== this.keys.length || lineString[lineString.length - 1] === ',') {
                this.tailChunk = line
            } else {
                const chunkObject = {}

                this.keys.forEach((element, index) => {
                    chunkObject[element] = values[index]
                })

                this.tailChunk = ''

                controller.enqueue(`${JSON.stringify(chunkObject)}`)
            }
        }
    },

    flush() {

    }

}

let loaded = 0
let sent = 0
const objectsToSend = []

const ProgressTransform = {

    percentage: 0,

    transform(chunk, controller) {
        loaded += chunk.length
        controller.enqueue(chunk)
        postMessage({ progressLoaded: loaded, progressSent: sent, index: fileIndex })
    },
    flush() {
    }
}



const postRequest = async data => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            sent++
            postMessage({ progressSent: sent, progressLoaded: loaded, index: fileIndex })
            resolve(data)
        }, 0)
    })
}


const writable = new WritableStream({
    async write(chunk) {
        objectsToSend.push(await postRequest(JSON.parse(chunk)))
    },
    async close() {
        postMessage({ totalToSend: objectsToSend.length, index: fileIndex, progressLoaded: loaded, progressSent: sent })
        await Promise.all(objectsToSend)
    },
    abort(err) {
        console.log("Sink error:", err);
    },
})

let readableStream = null
let fileIndex = null

addEventListener("message", event => {
    fileIndex = event.data.index
    readableStream = event?.data?.file?.stream()
    readableStream
        .pipeThrough(new TransformStream(ProgressTransform))
        .pipeThrough(new TransformStream(ObjectTranform))
        .pipeTo(writable)
})
