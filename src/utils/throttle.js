import './uniqueID.js'

const wait = {}

const throttle = (cb, limit) => {
    const id = cb.uniqId

    if (wait[id]) {
        wait[id] = [cb]
        return
    }

    cb()
    wait[id] = []
    setTimeout(() => {
        wait[id].forEach(cb => cb())
        wait[id] = null
    }, limit)
}

export default throttle
