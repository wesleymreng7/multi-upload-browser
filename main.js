const input = document.getElementById('files')
const progress = document.getElementById('progress')



const formatBytes = (bytes, decimals = 2) => {
    if (!+bytes) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

input.addEventListener('change', async (e) => {
    const files = e.target.files
    const workersInfo = []

    for (const i in files) {
        const worker = new Worker("threadWorker.js")
        if (files[i].name) {
            worker.postMessage({ index: i, name: files[i].name, file: files[i] })

            worker.addEventListener("message", event => {
                if (event.data) {
                    const infos = {
                        progressSent: event.data.progressSent, progressLoaded: event.data.progressLoaded, index: event.data.index, totalToSend: event.data.totalToSend, fileSize: files[i].size, fileName: files[i].name
                    }
                    workersInfo[i] = infos
                }

                progress.innerHTML = `
                    <table align="center" border cellspacing="1">
                        <thead>
                            <tr>
                                <th>File</th>
                                <th>File Size</th>
                                <th>Loaded</th>
                                <th></th>
                                <th>Lines Sent</th>
                            </tr>    
                        </thead>
                        <tbody>
                            ${workersInfo.map(info =>
                    `<tr>
                                    <td>${info.fileName}</td>
                                    <td>${formatBytes(info.fileSize)}</td>
                                    <td>${formatBytes(info.progressLoaded)}</td>
                                    <td><progress value="${Math.ceil(info.progressLoaded / info.fileSize * 100)}" max="100"> 32% </progress></td>
                                    <td>${info.progressSent}</td>
                                </tr>`
                )}
                        </tbody>
                    </table>
                    `

            })
        }
    }
})