// Description:
//   Middleware to prevent certain commands to be run in certain rooms
//
module.exports = function(robot) {

  robot.listenerMiddleware(function(context, next, done){
    if(context.response.message.text) {
        var id = context.listener.options.id;
        var room = context.response.envelope.room;
        var cb = robot.brain.data.commandBlacklists || {};
        var blacklist = cb[room] || [];
        if (blacklist.indexOf(id) !== -1) {
          context.response.reply("Sorry, that command is locked in " + room + " rn.");
          done();
        } else {
          next(done);
        }
    } else {
      next(done);
    }
  });
}
