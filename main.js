const input = document.getElementById('files')
const progress = document.getElementById('progress')


input.addEventListener('change', async (e) => {
    const stream = e.target.files[0].stream()
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
                                <th>Sent</th>
                            </tr>    
                        </thead>
                        <tbody>
                            ${workersInfo.map(info =>
                    `<tr>
                                    <td>${info.fileName}</td>
                                    <td>${info.fileSize}</td>
                                    <td>${info.progressLoaded}</td>
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