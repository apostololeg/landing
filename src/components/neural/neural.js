import { bind } from 'decko'
import * as THREE from 'three'
import './neural.styl'

const PI2 = Math.PI * 2
const STEP = 5
const SPRITE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAw%0AL3N2ZyI+PHBhdGggZmlsbD0ibm9uZSIgZD0iTS0xLTFoMjJ2MjJILTF6Ii8+PGc+PHBhdGggZD0i%0ATS0xLTFoNTgydjQwMkgtMVYtMXoiIGZpbGw9Im5vbmUiLz48ZWxsaXBzZSByeT0iOC45NjEiIHJ4%0APSI4Ljk2MSIgY3k9IjkuOTM1IiBjeD0iOS45MzUiIGZpbGw9IiNmZmYiLz48L2c+PC9zdmc+'

function degreeToRad(deg) {
    return deg
        ? deg / 180 * Math.PI
        : 0
}

class Neural {
    constructor(domElem, props) {
        this.domElem = domElem
        this.props = props

        const {
            clientWidth,
            clientHeight } = this.domElem

        // renderer
        this._renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true
        })
        this._renderer.setPixelRatio(window.devicePixelRatio)
        this._renderer.setSize(clientWidth, clientHeight)
        domElem.appendChild(this._renderer.domElement)

        // scene
        this._scene = new THREE.Scene()

        // camera
        this._camera = new THREE.PerspectiveCamera(45, clientWidth / clientHeight, 1, 200)
        this._camera.position.set(0, 0, 100)
        this._camera.lookAt(new THREE.Vector3(0, 0, 0))

        // light
        this._ambientLight = new THREE.AmbientLight(0xcccccc, .4)
        this._pointLight = new THREE.PointLight(0xffffff, 0.8)

        this._container = new THREE.Group()

        this._camera.add(this._pointLight)
        this._scene.add(this._camera)
        this._scene.add(this._ambientLight)
        this._scene.add(this._container)

        this._clock = new THREE.Clock()
        this._tree = this._buildThree()
        this._data = {}
        this._dataGenerationSpeed = 1000 // ms
        this._animationSpeed = 1

        window.addEventListener('resize', this._onWindowResize, false)
        domElem.addEventListener('click', this._onClick, false)

        this._startGeneratingData()
        this._animate()
    }

    @bind _onWindowResize() {
        const {
            clientWidth,
            clientHeight } = this.domElem
        const aspect = clientWidth / clientHeight

        if (aspect === this._camera.aspect) {
            return
        }

        this._camera.aspect = aspect
        this._camera.updateProjectionMatrix()

        this._renderer.setSize(clientWidth, clientHeight)
    }

    @bind _onClick() {
        // this._container.remove()
    }

    _buildThree() {
        let baseNode = this._buildNode([0, 0, 0])
        let baseAngles = [
            [0, 0],
            [90, 90],
            [180, 0],
            [90, 270],
            [270, 90],
            [270, 270]
        ]

        return baseAngles.map(([x, z]) => this._buildBranch(
            baseNode,
            {
                x: degreeToRad(x),
                z: degreeToRad(z)
            },
            10,
            10
        ))
    }

    _buildBranch(baseNode, baseAngle, branchesCount, subbranchesCount) {
        let x, y, z
        let nodes = [baseNode]
        let currentPos = [
            baseNode.dot.position.x,
            baseNode.dot.position.y,
            baseNode.dot.position.z
        ]

        for (var i = 0; i < branchesCount - 1; i ++) {
            let angleCoeff = i / length / 2 + 1
            let stemAngle = this._generateBaseAngle(baseAngle, angleCoeff)
            let pos = this._getNextPos(currentPos, stemAngle)
            let node = this._buildNode(pos, currentPos)

            // subbranches
            if (--subbranchesCount > 0 && Math.random() * i  < length / 2) {
                let subbranchBaseAngle = this._generateBaseAngle(baseAngle, angleCoeff)

                node.nodes = this._buildBranch(
                    node,
                    subbranchBaseAngle,
                    branchesCount - i,
                    Math.random() * i
                )
            }

            this._container.add(node.line)
            nodes.push(node)
            currentPos = pos
        }

        return nodes
    }

    _buildDot([ x, y, z ], color) {
        const material = this._getDotMaterial(color)
        const dot = new THREE.Sprite(material)

        dot.position.set(x, y, z)
        this._container.add(dot)

        return dot
    }

    _buildNode(pos, prevPos) {
        const node = {
            pos,
            dot: this._buildDot(pos),
            weight: 0
        }

        if (prevPos) {
            node.line = this._buildLine(prevPos, pos, .05, '#027ffe')
        }

        return node
    }

    _buildLine([ox, oy, oz], [dx, dy, dz], weight = 1, color = '#000') {
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(ox, oy, oz),
            new THREE.Vector3(dx, dy, dz)
        ])
        const geometryTube = new THREE.TubeGeometry(
            curve, // path
            1,     // tubularSegments
            weight,// radius
            3,     // radialSegments
            false  // closed
        )
        const material = new THREE.MeshBasicMaterial({
            color,
            wireframe: false,
            transparent: true,
            //opacity:0.5
        })
        const line = new THREE.Mesh(geometryTube, material)

        this._container.add(line)

        return line
    }

    _getNextPos([x, y, z], baseAngle) {
        let diap = Math.PI / 5 // 36 deg
        let alphaX = baseAngle.x - diap + Math.random() * diap
        let alphaZ = baseAngle.z - diap + Math.random() * diap

        let a = Math.sin(alphaX) * STEP
        let b = Math.cos(alphaX) * STEP
        let c = Math.sin(alphaZ) * STEP

        return [
            x + a,
            y + b,
            z + c
        ]
    }

    _getDotMaterial(color = '#1f86ed') {
        return new THREE.SpriteMaterial({
            map: this._getDotTexture(),
            color
        })
    }

    _getDotTexture() {
        if (this._dotTexture) {
            return this._dotTexture
        }

        const image = new Image()
        const texture = new THREE.Texture()

        image.onload = () => texture.needsUpdate = true
        image.src = SPRITE
        texture.image = image

        return this._dotTexture = texture
    }

    _startGeneratingData() {
        this._generateDataTimeout = setTimeout(() => {
            this._generateData()
            this._startGeneratingData()
        }, this._dataGenerationSpeed)
    }

    _generateData() {
        let id = Math.random().toString(36).slice(2)
        let index = Math.floor(Math.random() * this._tree.length)
        let branch = this._tree[index]
        let dot = this._buildDot([0, 0, 0], '#00cbdc')

        this._data[id] = {
            branch,
            index: 0,
            dot,
            speed: Math.max(Math.min(Math.random() * 2, 1.5), .8)
        }
    }

    _generateBaseAngle({ x, z }, coeff) {
        let diap = Math.PI / 3 * coeff

        return {
            x: x - diap + diap * Math.random(),
            z: z - diap + diap * Math.random()
        }
    }

    _updateDataPositions(delta) {
        Object.keys(this._data).forEach(id => {
            let data = this._data[id]
            let {
                branch,
                index,
                dot,
                speed } = data

            let start = branch[index]
            let target = branch[index + 1]

            let [ sx, sy, sz ] = start.pos
            let [ tx, ty, tz ] = target.pos
            let { x, y, z } = dot.position

            let coeff = this._animationSpeed * speed * delta
            let nx = x + (tx - sx) * coeff
            let ny = y + (ty - sy) * coeff
            let nz = z + (tz - sz) * coeff

            if (Math.abs(nx) > Math.abs(tx)) {
                let isLast = index + 1 >= branch.length - 1

                if (target.nodes && (isLast || Math.random() > .5)) {
                    // switch branch
                    data.branch = target.nodes
                    data.index = 0
                } else if (isLast) {
                    // delete item
                    this._container.remove(dot)
                    delete this._data[id]
                } else {
                    // next dot
                    let [nsx, nsy, nsz] = branch[index + 1].pos
                    data.index++
                    dot.position.set(nsx, nsy, nsz)
                }
            } else {
                dot.position.set(nx, ny, nz)
            }
        })
    }

    @bind _animate() {
        const delta = this._clock.getDelta()

        this._container.rotation.y += .001
        this._container.rotation.z += .001

        this._updateDataPositions(delta)

        this._renderer.render(this._scene, this._camera)

        requestAnimationFrame(this._animate)
    }
}

export default Neural
