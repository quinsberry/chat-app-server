const rooms = require('../index')

function RoomsController() { }

const create = function (req, res) {
  const { roomId, userName } = req.body

  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Map([
      ['users', new Map()],
      ['messages', []]
    ]))
  }

  console.log('post rooms:  ', rooms)
  res.status(200).json({
    success: true,
    errors: []
  })
}

RoomsController.prototype = {
  create
}



module.exports = RoomsController