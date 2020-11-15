const express = require('express')
const cors = require('cors')
const useSocket = require('socket.io')

const { RoomsCtrl } = require('./Controllers')

const app = express()
const server = require('http').Server(app)
const io = useSocket(server)

const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

// rooms is a fake db
const rooms = new Map()

app.get('/rooms/:id', (req, res) => {
  const { id: roomId } = req.params

  const obj = rooms.has(roomId)
    ? {
        users: [...rooms.get(roomId).get('users').values()],
        messages: [...rooms.get(roomId).get('messages').values()],
      }
    : { users: [], messages: [] }

  res.status(200).json({
    success: true,
    data: obj,
    error: [],
  })
})

// app.post('/rooms', RoomsCtrl.create)

app.post('/rooms', (req, res) => {
  const { roomId, userName } = req.body

  if (!rooms.has(roomId)) {
    rooms.set(
      roomId,
      new Map([
        ['users', new Map()],
        ['messages', []],
      ]),
    )
  }

  if (rooms.get(roomId).get('users').has(userName)) {
    res.status(401).json({
      success: false,
      errors: 'This username is already exists.',
    })
  }

  res.status(200).json({
    success: true,
    errors: [],
  })
})

io.on('connection', (socket) => {
  socket.on('ROOM:JOIN', ({ roomId, userName }) => {
    socket.join(roomId)
    rooms.get(roomId).get('users').set(socket.id, userName)
    const users = [...rooms.get(roomId).get('users').values()]
    socket.to(roomId).broadcast.emit('ROOM:SET_USERS', users)
  })

  socket.on('ROOM:NEW_MESSAGE', ({ roomId, userName, text }) => {
    const obj = {
      userName,
      text,
    }
    rooms.get(roomId).get('messages').push(obj)
    socket.to(roomId).broadcast.emit('ROOM:NEW_MESSAGE', obj)
  })

  socket.on('disconnect', () => {
    rooms.forEach((value, roomId) => {
      if (value.get('users').delete(socket.id)) {
        const users = [...value.get('users').values()]
        socket.to(roomId).broadcast.emit('ROOM:SET_USERS', users)
      }
    })
  })
})

server.listen(PORT, (err) => {
  if (err) {
    throw Error(err)
  }
  console.log('Server has been started..')
})

module.exports = rooms
