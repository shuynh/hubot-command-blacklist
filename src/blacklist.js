// Description:
//   Sets the permissions for commands in a room
//
// Configuration:
//   HUBOT_DEFAULT_COMMANDS - comma seperated list of command ids that can't be disabled.
//
// Commands:
//   hubot lock/unlock deploys - lock/unlock deploys in the current room
//
// Author:
//   Kristen Mills <kristen@kristen-mills.com>


module.exports = function(robot) {
  var defaults = ['room.unlock', 'room.list-commands', 'room.lock'];
  if(process.env.HUBOT_DEFAULT_COMMANDS){
    var split = process.env.HUBOT_DEFAULT_COMMANDS.split(',');
    defaults = robot.brain.data.defaultCommands = defaults.concat(split);
  } else {
    robot.brain.data.defaultCommands = defaults;
  }

  robot.respond(/unlock (.*)/i, {id: 'room.unlock'}, function(msg) {
    var room = msg.message.room;
    var user = msg.envelope.user;

    if(!process.env.HUBOT_AUTH_ADMIN || // if not using hubot auth anyone can do this
      robot.auth.hasRole(user, 'deployer') ||
      robot.auth.isAdmin(user)
    ) {
      var commandId = msg.match[1];

      var commandBlacklists = robot.brain.data.commandBlacklists = robot.brain.data.commandBlacklists || {};
      commandBlacklists[room] = commandBlacklists[room] || [];
      var index = commandBlacklists[room].indexOf(commandId);
      var commands = robot.listeners.reduce(function(prev, l){
        if(l.options.id) {
          prev.push(l.options.id);
        }
        return prev;
      }, []);

      if(commandId === 'all'){
        commandBlacklists[room] = [];
        robot.brain.save();
        msg.send('All commands enabled in ' + room);
      } else if(commands.indexOf(commandId) === -1){
        msg.send(commandId + " is not an available command.  run `list commands` to see the list.");
      } else if(index === -1){
        msg.send(commandId + " are already unlocked in " + room);
      } else {
        commandBlacklists[room].splice(index, 1);
        robot.brain.save();
        msg.send("Ok, " + commandId + " are unlocked in " + room);
      }
    } else {
      msg.send("I'm sorry, I'm afraid I cant do that");
    }
  });

  robot.respond(/lock (.*)/i, {id: 'room.lock'}, function(msg) {
    var room = msg.message.room;
    var user = msg.envelope.user;

    if(!process.env.HUBOT_AUTH_ADMIN || // if not using hubot auth anyone can do this
      robot.auth.hasRole(user, room + '-admin') ||
      robot.auth.isAdmin(user)
    ) {
      var commandId = msg.match[1];
      var room = msg.message.room;

      var commandBlacklists = robot.brain.data.commandBlacklists = robot.brain.data.commandBlacklists || {};
      commandBlacklists[room] = commandBlacklists[room] || [];

      var index = commandBlacklists[room].indexOf(commandId);
      var commands = robot.listeners.reduce(function(prev, l){
        if(l.options.id && defaults.indexOf(l.options.id) === -1) {
          prev.push(l.options.id);
        }
        return prev;
      }, []);

      if(commandId === 'all'){
        commandBlacklists[room] = commands;
        robot.brain.save();
        msg.send('All commands disabled in ' + room);
      } else if(index !== -1){
        msg.send(commandId + " are already locked in " + room);
      } else if(defaults.indexOf(commandId) !== -1){
        msg.send("Why on earth would you want to disable this command? Stahp.")
      } else if(commands.indexOf(commandId) === -1) {
        msg.send(commandId + " is not an available command.  run `list commands` to see the list.");
      } else {
        commandBlacklists[room].push(commandId);
        robot.brain.save();
        msg.send("Ok, " + commandId + " are locked in " + room);
      }
    } else {
      msg.send("I'm sorry, I'm afraid I cant do that");
    }
  });

}
