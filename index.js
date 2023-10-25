// импорт необходимых модулей
const mine = require('mineflayer')
const Vec3 = require('vec3').Vec3
const fs = require('fs')
let spacing = false
let session = -1
let session_name = null
require('./keep_alive.js')


const { pathfinder, Movements } = require('mineflayer-pathfinder')
const { GoalBlock } = require('mineflayer-pathfinder').goals

// const join = require('./join.js');

// Создание бота
const bot = mine.createBot({
	host: 'dmc-minecraft.ru',
	port: 25565,
	username: 'Griffon',
	checkTimeoutInterval: 60 * 1000 * 60
})
// Загрузка pathfinder
bot.loadPlugin(pathfinder)

// Настройка
// const pathToDoorCords = {
// 	x: 29,
// 	y: 74,
// 	z: 10,
// }
// const doorCords = {
// 	x: 29,
// 	y: 74,
// 	z: 9,
// }
// const elevatorArea = {
// 	firstPose: {
// 		x: 28,
// 		y: 74,
// 		z: 6,
// 	},
// 	secondPose: {
// 		x: 30,
// 		y: 76,
// 		z: 8,
// 	},
// }
const pathToDoorCords = {
	x: 25,
	y: 74,
	z: 10,
}
const doorCords = {
	x: 25,
	y: 74,
	z: 9,
}
const elevatorArea = {
	firstPose: {
		x: 24,
		y: 74,
		z: 6,
	},
	secondPose: {
		x: 26,
		y: 76,
		z: 8,
	},
}

const maxSessionTime = 1000 * 60 * 1.5



// Логирование с временем
function print(text) {	
	let moscowTime = new Date().toLocaleString("ru-RU", {timeZone: "Europe/Moscow", day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'});
	console.log(`[${moscowTime}] ${text}`);
	fs.appendFile('log.txt', `[${moscowTime}] ${text}\n`, err => {
		if (err)
			console.log('Не удалось записать лог, ' + err);
	})
	
}


// Установка путя до двери в лифт
function goToDoor() {
	bot.chat("/pay _IKaver_ 5")
	print("[INFO] Bot go to elevator door.")
	const goal = new GoalBlock(pathToDoorCords.x, pathToDoorCords.y, pathToDoorCords.z);
	const dMove = new Movements(bot);
	dMove.allowSprinting = false
	dMove.canDig = false
	bot.pathfinder.setMovements(dMove);
	bot.pathfinder.setGoal(goal)
}

function goToPath(x, y, z) {
	const goal = new GoalBlock(x, y, z);
	const dMove = new Movements(bot);
	dMove.allowSprinting = false
	dMove.canDig = false
	bot.pathfinder.setMovements(dMove);
	bot.pathfinder.setGoal(goal)
}

// Bot login
function login(bot) {
	bot.once('spawn', (username, message) => {
		bot.acceptResourcePack()
		setTimeout(() => {
			if (bot.currentWindow) bot.closeWindow(bot.currentWindow)
			print('[INFO] Bot spawned and ready to work!')
			return true
		}, 1500)
	})

	bot.on('actionBar', (message) => {
		const msg = message + '.'

		if (msg.includes('seconds to login')) {
			print("[INFO] Bot tring to login.")
			setTimeout(() => {
				bot.chat('/login KaverBusy');
			}, '500')
		}
	})
}

// Logging session
function sessionLog() {
	const timeoutSession = session
	setTimeout(() => {
		if (timeoutSession == session) {
			bot.pathfinder.stop()
			bot.setControlState('forward', false)
			bot.setControlState('back', false)
			bot.setControlState('left', false)
			bot.setControlState('right', false)
			bot.setControlState('jump', false)
			print("[ !!! WARN !!! ] Session №" + session + " timeout. Bot will teleport to lobby.")
			lobby()
		}
	}, maxSessionTime)
}

// Bot go to lobby
function lobby() {
	bot.chat('/lobby')
	const oldSession = session

	setTimeout(() => {
		if (bot.currentWindow)
	    	bot.simpleClick.leftMouse(53)
	}, 800)

	setTimeout(() => {

		const world = sessionBlockCheck()
		if (!world) {
			if (oldSession === session) lobby()
			return;
		}
		session += 1

		print("[INFO] Bot re-spawned, world: " + world + ". Session: " + session)
		sessionLog()

		if (world === "doors") {
			doorsEntered()
		} else if (world === "lobby") {
			goToDoor()
		}


	}, 1500)
}


// При первом заходе он приветсвует своих хазяев
const greeding = false
bot.once('spawn', () => {
	if (greeding)
	setTimeout(() => {
		bot.chat("/msg PabloBusy привет, пра-дедушка!")
		bot.chat("/msg _IKaver_ привет, папа!")
	}, 2000)
})


// При достижении цели: дошел до лифта, бот входит в лифт
bot.on('goal_reached', () => {
	if (Math.floor(bot.entity.position.x) != pathToDoorCords.x || 
		Math.floor(bot.entity.position.y) != pathToDoorCords.y || 
		Math.floor(bot.entity.position.z) != pathToDoorCords.z) return

	let intervalID = null
	const oldSession = session
	
	print("[INFO] Bot reached elevator door.")

	function while1() {
		intervalID = setInterval(() => {
			if (oldSession != session) { bot.setControlState('forward', false); return }
			if (Math.floor(bot.entity.position.x) == doorCords.x &&
				Math.floor(bot.entity.position.y) == doorCords.y &&
				Math.floor(bot.entity.position.z) == doorCords.z) { clearInterval(intervalID); setTimeout(() => { while2() }, 50)}

			
			bot.lookAt(new Vec3(((elevatorArea.secondPose.x - elevatorArea.firstPose.x) / 2) + elevatorArea.firstPose.x + 0.5,
						((elevatorArea.secondPose.y - elevatorArea.firstPose.y) / 2) + elevatorArea.firstPose.y + 0.5,
						((elevatorArea.secondPose.z - elevatorArea.firstPose.z) / 2) + elevatorArea.firstPose.z + 0.5))
			bot.setControlState('forward', true)
		}, 50)
	}

	function while2() {
		bot.setControlState('forward', false)
		print("[INFO] Bot start jumping in elevator door!")
		intervalID = setInterval(() => {
			if (oldSession != session) { spacing = false; return }
			if (Math.floor(bot.entity.position.x) >= elevatorArea.firstPose.x && Math.floor(bot.entity.position.x) <= elevatorArea.secondPose.x &&
				Math.floor(bot.entity.position.y) >= elevatorArea.firstPose.y && Math.floor(bot.entity.position.y) <= elevatorArea.secondPose.y &&
				Math.floor(bot.entity.position.z) >= elevatorArea.firstPose.z && Math.floor(bot.entity.position.z) <= elevatorArea.secondPose.z) {
				setTimeout(() => { while3() }, 50)
				clearInterval(intervalID)}
			
			spacing = true
		}, 50)
	}
	
	function while3() {
		spacing = false
		print("[INFO] Bot moved to elevator.")
	}
	
	while1()
	
})
// Бесконечные прыжки
bot.on('physicsTick', () => {
	if (spacing) {
		bot.setControlState('jump', true)
		bot.setControlState('jump', false)
	}
})


// Действия при заходе в дурс
function doorsEntered() {
	if (!bot.blockAt(new Vec3(-1, 101, 1))) {lobby(); return}
	bot.activateBlock(bot.blockAt(new Vec3(-1, 101, 1)), new Vec3(0, 1, 0), new Vec3(0.5, 0.5, 0.9))
	setTimeout(() => { goToPath(0, 100, 2) }, 1300) // -7 100 5 (0.5 0.5 0.9)
	
}
// При достижении цели: дошел до двери лифта в игре doors
bot.on('goal_reached', () => {
	if (Math.floor(bot.entity.position.x) != 0 || 
	Math.floor(bot.entity.position.y) != 100 || 
	Math.floor(bot.entity.position.z) != 2) return

	setTimeout(() => {

		setTimeout(() => {
			bot.setControlState('forward', false)
			print("[INFO] Bot leave in-game's elevator")
		}, 850)
		setTimeout(() => {
			goToPath(-7, 100, 5)
		}, 900)
		
		bot.lookAt(new Vec3(1, 102, 4))
		bot.setControlState('forward', true)
		
	}, 150)
})
// При достижении цели: дошел до таблчики
bot.on('goal_reached', () => {
	if (Math.floor(bot.entity.position.x) != -7 || 
	Math.floor(bot.entity.position.y) != 100 || 
	Math.floor(bot.entity.position.z) != 5) return

	setTimeout(() => {
		bot.activateBlock(bot.blockAt(new Vec3(-7, 100, 5)), new Vec3(0, 1, 0), new Vec3(0.5, 0.5, 0.1))
		setTimeout(() => {
			lobby()
		}, 1100)
	}, 400)
})


// Когда бот респавнится, меняется его сессия
bot.on('spawn', () => {
	// Отделение от разных сессий скрипта в log.txt
	if (session == -1) {
		session += 1
	 	fs.appendFile('log.txt', `\n`, err => {
	 		if (err)
	 			console.log('Не удалось записать лог, ' + err);
	 	})
	 }

	const oldSession = session
	setTimeout(() => {

		const world = sessionBlockCheck()
		if (!world) {
			if (oldSession === session) lobby()
			return;
		}
		session += 1
		
		print("[INFO] Bot re-spawned, world: " + world + ". Session: " + session)
		sessionLog()
		
		if (world === "doors") {
			setTimeout(() => {
				doorsEntered()
			}, 1500)
		} else if (world === "lobby") {
			setTimeout(() => {
				goToDoor()
			}, 1500)
		}
		
		
	}, 350)
	
	
	
// 	setTimeout(() => { if (bot.blockAt(new Vec3(25, 73, 27))) print("[BLLBLBL] " + bot.blockAt(new Vec3(25, 73, 27)).name) }, 200) //blast_furnace
// 	session += 1
// 	if (session == 1) {
// 		fs.appendFile('log.txt', `\n`, err => {
// 			if (err)
// 				console.log('Не удалось записать лог, ' + err);
// 		})
// 	}
// 	if (doors === "wait") {
// 		setTimeout(() => {
// 			if (bot.blockAt(new Vec3(0, 99, 0)) && bot.blockAt(new Vec3(0, 99, 0)).name === "blast_furnace") {
// 				doors = true
// 				print("[INFO] Bot spawned in doors-game!")
// 				doorsEntered()
// 			}
// 		}, 1200)
// 	}
// 	if (doors === true) {
// 		doors = "leave"
// 	} else if (doors === "leave") {
// 		doors = false
// 		print("[INFO] Bot leave doors-game")
// 		setTimeout(() => { goToDoor() }, 500)
// 	}
// 	print("[INFO] Bot session changed. Session: " + session + " (Re-spawned)")
// 	sessionLog()
})
function sessionBlockCheck() {
	// Проверка на дурс
	if (bot.blockAt(new Vec3(0, 99, 0)) && bot.blockAt(new Vec3(0, 99, 0)).name === "blast_furnace") {
		return "doors"
	// Проверка на лобби
	} else if (bot.blockAt(new Vec3(25, 73, 27)) && bot.blockAt(new Vec3(25, 73, 27)).name === "ender_chest") {
		return "lobby"
	}
}


// bot.once('spawn', () => {
//   setTimeout(() => {
//     const goal = new GoalBlock(25, 74, 10);
//     const dMove = new Movements(bot);
//     dMove.allowSprinting = false
//     dMove.canOpenDoors = true
//     dMove.canDig = false
//     bot.pathfinder.setMovements(dMove);
//     bot.pathfinder.setGoal(goal);
//   }, 4000);
// });

// bot.on('goal_reached', function () {
//   if (Math.floor(bot.entity.position.x) === 25 && Math.floor(bot.entity.position.y) === 74 && Math.floor(bot.entity.position.z) === 10){
//     setTimeout(() => {bot.lookAt(new Vec3(25.5, 76, 8))}, 300)
//     setTimeout(() => {bot.setControlState('forward', true)}, 500)
//     setTimeout(() => {bot.setControlState('forward', false)}, 5000)
//     spacing = true
//   }
//   // if (Math.floor(bot.entity.position.x) === 4 && Math.floor(bot.entity.position.y) === 100 && Math.floor(bot.entity.position.z) === 8){
//   // 	setTimeout(() => {
//   // 		bot.activateBlock((bot.blockAt(new Vec3(4, 100, 8), new Vec3(0, 1, 0), new Vec3(0.9, 0.5, 0.5))))
//   // 	}, 200)
//   // }
//   if (Math.floor(bot.entity.position.x) === -7 && Math.floor(bot.entity.position.y) === 100 && Math.floor(bot.entity.position.z) === 5){
//     setTimeout(() => {
//       if (bot.blockAt(new Vec3(-7, 100, 5)).displayName === 'Oak Sign') {
//         bot.activateBlock((bot.blockAt(new Vec3(-7, 100, 5), new Vec3(0, 1, 0), new Vec3(0.5, 0.5, 0.1))))
//       }
//     }, 200)
//     setTimeout(() => {
//       bot.chat('/lobby')
//     }, 1600)
//     setTimeout(() => {
//       bot.simpleClick.leftMouse(53)
//     }, 1900)
//     setTimeout(() => {
//       const goal = new GoalBlock(25, 74, 10);
//       const dMove = new Movements(bot);
//       dMove.allowSprinting = false
//       dMove.canOpenDoors = true
//       dMove.canDig = false
//       bot.pathfinder.setMovements(dMove);
//       bot.pathfinder.setGoal(goal);
//     }, 2600);
//   }
//   // if (Math.floor(bot.entity.position.x) === 4 && Math.floor(bot.entity.position.y) === 100 && Math.floor(bot.entity.position.z) === 15){
//   // 	setTimeout(() => {
//   // 		bot.activateBlock((bot.blockAt(new Vec3(4, 100, 15), new Vec3(0, 1, 0), new Vec3(0.9, 0.5, 0.5))))
//   // 	}, 200)
//   // }
// });

// bot.on('physicTick', () => {
//   if (spacing) {
//     bot.setControlState('jump', true)
//     bot.setControlState('jump', false)
//     if(Math.floor(bot.entity.position.x) != 33 && Math.floor(bot.entity.position.y) != 74 && Math.floor(bot.entity.position.z) != 10){
//       spacing = false
//       setTimeout(() => {
//         bot.chat('/lobby')
//       }, 10200)
//       setTimeout(() => {
//         bot.simpleClick.leftMouse(53)
//       }, 10500)
//       setTimeout(() => {
//         const goal = new GoalBlock(25, 74, 10);
//         const dMove = new Movements(bot);
//         dMove.allowSprinting = false
//         dMove.canOpenDoors = true
//         dMove.canDig = false
//         bot.pathfinder.setMovements(dMove);
//         bot.pathfinder.setGoal(goal);
//       }, 11200);
//     }
//   }
// });

// bot.on('spawn', function() {
//   if (doors === 0) {
//     doors = 1
//   } else if (doors === 1) {
//     doors = 2
//     console.log("Bot spawned in doors elevator")
//     setTimeout(() => {
//       const goal = new GoalBlock(0, 100, 2);
//       const dMove = new Movements(bot);
//       dMove.allowSprinting = false
//       dMove.canOpenDoors = true
//       dMove.canDig = true
//       dMove.allowParkour = false
//       bot.pathfinder.setMovements(dMove);
//       bot.pathfinder.setGoal(goal);
//     }, 1000);
//     setTimeout(() => {bot.lookAt(new Vec3(1, 102, 3))}, 28000)
//     setTimeout(() => {bot.setControlState('forward', true)}, 28500)
//     setTimeout(() => {bot.setControlState('forward', false)}, 29500)
//     // setTimeout(function() {
//     // 	const goal = new GoalBlock(1, 100, 8);
//     // 	const dMove = new Movements(bot);
//     // 	dMove.allowSprinting = false
//     // 	dMove.canOpenDoors = true
//     // 	dMove.canDig = true
//     // 	dMove.allowParkour = false
//     // 	bot.pathfinder.setMovements(dMove);
//     // 	bot.pathfinder.setGoal(goal);
//     // }, 34000)
//     // setTimeout(function() {
//     // 	console.log(bot.blockAt(new Vec3(4, 100, 8)))
//     // 	if (bot.blockAt(new Vec3(4, 100, 8)).displayName === 'Oak Sign') {
//     // 		const goal = new GoalBlock(4, 100, 8);
//     // 		const dMove = new Movements(bot);
//     // 		dMove.allowSprinting = false
//     // 		dMove.canOpenDoors = true
//     // 		dMove.canDig = true
//     // 		dMove.allowParkour = false
//     // 		bot.pathfinder.setMovements(dMove);
//     // 		bot.pathfinder.setGoal(goal);
//     // 	}
//     // }, 40000)
//     setTimeout(function() {
//       //console.log(bot.blockAt(new Vec3(-7, 100, 5)))
//       const goal = new GoalBlock(-7, 100, 5);
//       const dMove = new Movements(bot);
//       dMove.allowSprinting = false
//       dMove.canOpenDoors = true
//       dMove.canDig = false
//       bot.pathfinder.setMovements(dMove);
//       bot.pathfinder.setGoal(goal);
//     }, 29600)
//     setTimeout(function() {
//       if (doors === 0) {
//         console.log("Fucking Player detected!")
//         bot.pathfinder.stop()
//         setTimeout(() => {
//           bot.chat('/lobby')
//         }, 200)
//         setTimeout(() => {
//           bot.simpleClick.leftMouse(53)
//         }, 500)
//         setTimeout(() => {
//           const goal = new GoalBlock(25, 74, 10);
//           const dMove = new Movements(bot);
//           dMove.allowSprinting = false
//           dMove.canOpenDoors = true
//           dMove.canDig = false
//           bot.pathfinder.setMovements(dMove);
//           bot.pathfinder.setGoal(goal);
//         }, 1200);
//       }
//     }, 34800)
//     // setTimeout(function() {
//     // 	console.log(bot.blockAt(new Vec3(4, 100, 15)))
//     // 	if (bot.blockAt(new Vec3(4, 100, 15)).displayName === 'Oak Sign') {
//     // 		const goal = new GoalBlock(4, 100, 15);
//     // 		const dMove = new Movements(bot);
//     // 		dMove.allowSprinting = false
//     // 		dMove.canOpenDoors = true
//     // 		dMove.canDig = false
//     // 		bot.pathfinder.setMovements(dMove);
//     // 		bot.pathfinder.setGoal(goal);
//     // 	}
//     // }, 60000)
//   } else if (doors === 2) {
//     console.log('Bot re-spawned!')
//     doors = 0
//   }
// })


// join.index(bot)

bot.on('kicked', (reason) => {
	print('[ !!!!! ERROR !!!!! ] Bot kicked. Reason: ' + reason);
	process.exit(0);
});

bot.on('error', (err) => {
	print('[ !!!!! ERROR !!!!! ] Bot error. Reason: ' + err);
	process.exit(0);
});


login(bot)
