let readableStream = null
let fileIndex = null
let bytesLoaded = 0
let linesSent = 0
const objectsToSend = []
let fileCompletelyLoaded = false
const readyEvent = new Event('ready')



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

}

const ProgressTransform = {
    transform(chunk, controller) {
        bytesLoaded += chunk.length
        controller.enqueue(chunk)
        postMessage({ progressLoaded: bytesLoaded, progressSent: linesSent, index: fileIndex, totalToSend: 0 })
    },
    flush() {
        fileCompletelyLoaded = true
    }
}


const MyWritable = {
    write(chunk) {
        objectsToSend.push(postRequest(JSON.parse(chunk)))
    },
    close() {
        if (fileCompletelyLoaded) {
            postMessage({ totalToSend: objectsToSend.length, index: fileIndex, progressLoaded: bytesLoaded, progressSent: linesSent })
            dispatchEvent(readyEvent)
        }
    },
    abort(err) {
        console.log("Sink error:", err);
    },
}

const postRequest = async data => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            linesSent++
            postMessage({ totalToSend: objectsToSend.length, progressSent: linesSent, progressLoaded: bytesLoaded, index: fileIndex })
            resolve(data)
        }, 3000)
    })
}


addEventListener('ready', async () => {
    await Promise.all(objectsToSend)
})


addEventListener("message", event => {
    fileIndex = event.data?.index
    readableStream = event.data?.file?.stream()
    readableStream
        .pipeThrough(new TransformStream(ProgressTransform))
        .pipeThrough(new TransformStream(ObjectTranform))
        .pipeTo(new WritableStream(MyWritable))
})
