const sw = true;
if (sw && navigator.onLine) {
	if ('serviceWorker' in navigator) {
		window.addEventListener('load', function() {
			navigator.serviceWorker.register('sw.js').then(function(reg) {
			}, function(err) {
				console.log(err);
			});
		});
	}
} else if (!sw && navigator.onLine) {
	if ('serviceWorker' in navigator) {
		navigator.serviceWorker.getRegistrations().then(function(registrations) {
			for (var registration of registrations) {
				registration.unregister();
			}
		});
	}
}


function rld() {
	if(navigator.onLine) {
		navigator.serviceWorker.getRegistrations().then(function(registrations) {
			for (var registration of registrations) {
				registration.unregister();
			}
		});	
	}
	location.reload();
}


const API = "https://api-mvlist.jipfr.nl/";
const loading = '<div class="loadWrapper"><div class="loadCenter"></div></div>';
const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
let user = {}
let tensLoaded = {
	"upcoming": 1,
	"watchlist": 1
}
recentInterval = setInterval(() => {});
watchlist = [];
upcoming = [];

if(!localStorage.getItem("user")) {
	document.querySelector("body").innerHTML = `
	<div class="authDivTop">
		<div class="authDiv">
			<div class="card">
				<h1>Sign in</h1>
				
				<p>Username</p>
				<input type="text" placeholder="Your username" class="username">
				
				<p>Password</p>
				<input type="password" placeholder="Your password" class="password">

				<p class="errorCode"></p>

				<div class="buttonDiv"><button onclick="signIn(document.querySelector('.username').value, document.querySelector('.password').value)">Sign in</button></div>
			</div>
			<div class="card">
				<h1>Sign up</h1>
				
				<p>Username</p>
				<input type="text" placeholder="Your new username" class="username2">
				
				<p>Password</p>
				<input type="password" placeholder="Insert a password" class="password2">
				
				<p>Confirm password</p>
				<input type="password" placeholder="Insert the password" class="password3">

				<p class="errorCodeUp"></p>

				<div class="buttonDiv"><button onclick="newUser(document.querySelector('.username2').value, document.querySelector('.password2').value, document.querySelector('.password2').value == document.querySelector('.password3').value)">Sign up</button></div>
			</div>
		</div>
	</div>
	
	`
}

window.onload = () => {
	if(navigator.onLine) {
		if(localStorage.getItem("user")) {
			loadUser();
		}	
	} else {
		document.querySelector(".containers").innerHTML = "Offline";
		document.querySelector(".navDiv").remove();
	}
	
}

if(localStorage.getItem("movieCache")) {
	movieCache = JSON.parse(localStorage.getItem("movieCache"));
} else {
	movieCache = {}
	localStorage.setItem("movieCache", JSON.stringify(movieCache));
}


toRestart = true;
document.addEventListener("scroll", () => {
	if(scrollTop < -120 && toRestart && localStorage.getItem("tab") !== "movie") {
		toRestart = false;
		loadUser();
	} else if(!toRestart && scrollTop >= 0) {
		toRestart = true;
	}
});

function addToMovieCache(obj) {
	Object.keys(obj).forEach(key => {
		movieCache[key] = obj[key];
	});
	localStorage.setItem("movieCache", JSON.stringify(movieCache));
}

updateNav();
function updateNav() {
	if(document.querySelector(".currentPage")) {
		document.querySelector(".currentPage").classList.remove("currentPage");
	}
	el = document.querySelector(`[data-navContainer="${localStorage.getItem('backupTab')}"]`);
	if(el) {
		el.classList.add("currentPage");	
	}
}

function search(value, isEnd = false) {
	// document.querySelector(".searchBox").innerHTML = loading;
	if(value.length > 0) {
		fetch(`${API}search?q=${value}&isEnd=${isEnd}`).then(data => {
			return data.json();
		}).then(data => {
			data = data.sort((a, b) => {
				if((a.Poster && a.Poster !== "N/A") && (!b.Poster || b.Poster == "N/A")) {
					return -1;
				} else if((b.Poster && b.Poster !== "N/A") && (!a.Poster || a.Poster == "N/A")) {
					return 1;
				} else {
					return 0;
				}
			});
			newHTML = "";
			data.forEach(movie => {
				movieCache[movie.imdbID] = movie;
				newHTML += `
				<div class="inlineMovie" onclick="showMovie('${movie.imdbID}')">
					<div class="inlineMovieLeft">
						<img src="${movie.Poster && movie.Poster !== "N/A" ? movie.Poster : 'assets/poster.png'}" class="poster small">
					</div>
					<div class="inlineMovieRight">
						<div>
							<h3 class="movieTitle movieText">${movie.Title}</h3>
							<h4 class="movieSubTitle movieText">${movie.Year}</h4>
						</div>
					</div>
				</div>
				`
			});
			localStorage.setItem("movieCache", JSON.stringify(movieCache));
			document.querySelector(".searchBox").innerHTML = newHTML;
		});
	}
}


function loadUser() {
	console.log("Loading user...");

	fetch(API + "user?q="+localStorage.getItem("user")).then(data => {
		return data.json();
	}).then(data => {
		console.log("Loaded!");
		if(data.status === 200) {
			tensLoaded = {
				"upcoming": 1,
				"watchlist": 1
			}
			console.log(data);
			user = data;

			document.querySelector(".movieInfoViews .toEdit").innerHTML = "This movie is not on your list.";
			document.querySelector(".addRemoveDetailsPos").innerHTML = "Add this movie to your watchlist";
			document.querySelector(".addRemoveDetailsNeg").innerHTML = "";

			if(user && document.querySelector(".movie").getAttribute("data-imdb-id")) {
				id = document.querySelector(".movie").getAttribute("data-imdb-id");
				user.seen.forEach(item => {
					if(item.id == id && item.watched.i > 0) {
						document.querySelector(".movieInfoViews .toEdit").innerHTML = `You have seen this movie ${item.watched.i} time(s)`;
						document.querySelector(".addRemoveDetailsPos").innerHTML = "I have just re-watched this movie!";
						document.querySelector(".addRemoveDetailsNeg").innerHTML = "Remove a view from this movie.";
					} else if(item.id == id && item.watched.i == 0) {
						document.querySelector(".movieInfoViews .toEdit").innerHTML = `You have not yet seen this movie`;
						document.querySelector(".addRemoveDetailsPos").innerHTML = "I have just seen this movie!";
						document.querySelector(".addRemoveDetailsNeg").innerHTML = "Remove this movie from my watch-list.";
					}
				});	
			}

			addToMovieCache(data.movieInfo);



			//	Updating recently watched

			recentlyWatched = [];
			data.seen.forEach(item => {
				if(item.watched.i > 0) {
					recentlyWatched.push(item);
				}	
			});
			recentlyWatched = recentlyWatched.sort((a,b) => {
				return b.watched.dates[b.watched.dates.length - 1] - a.watched.dates[a.watched.dates.length - 1]
			});


			document.querySelector(".recentlyWatched").innerHTML = "";
			updateRecentlyWatched(recentlyWatched);



			//	Updating watchlist

			watchlist = [];
			data.seen.forEach(item => {
				if(item.watched.i == 0 && new Date(movieCache[item.id].Released).getTime() < new Date().getTime()) {
					watchlist.push(item);
				}
			});

			watchlist = watchlist.sort((a, b) => {
				return b.added - a.added;
			});

			updateWatchlist(watchlist);



			//	Updating upcoming

			upcoming = [];
			data.seen.forEach(item => {
				if(new Date(movieCache[item.id].Released).getTime() + 1000 > new Date().setHours(0, 0, 0, 0)) {

					distance = new Date(movieCache[item.id].Released).getTime() - new Date().setHours(0, 0, 0, 0);
					item.days = Math.floor(distance / (1000 * 60 * 60 * 24));

					item.isToday = false;

					if(item.days == 0) {
						item.subtitle = "Today";
						item.isToday = true;
					} else if(item.days == 1) {
						item.subtitle = "Tomorrow";
					} else if(item.days < 7) {
						item.subtitle = weekdays[new Date(movieCache[item.id].Released).getDay()];
					} else {
						item.subtitle = item.days + " days remain";
					}

					upcoming.push(item);
				}
			});

			upcoming = upcoming.sort((a, b) => {
				return new Date(movieCache[a.id].Released).getTime() - new Date(movieCache[b.id].Released).getTime();
			});

			updateUpcoming(upcoming);



			//	Updating up next

			document.querySelector(".upNextDiv").innerHTML = "";
			data.seen.forEach(item => {
				if(item.isNext === true) {
					movie = movieCache[item.id];
					document.querySelector(".upNextDiv").innerHTML = `
						<h2 class="title">Up next</h2>
						<div class="inlineMovie" onclick="showMovie('${movie.imdbID}')">
							<div class="inlineMovieLeft">
								<img src="${movie.Poster && movie.Poster !== "N/A" ? movie.Poster : 'assets/poster.png'}" class="poster small">
							</div>
							<div class="inlineMovieRight">
								<div>
									<h3 class="movieTitle movieText">${movie.Title}</h3>
									<h4 class="movieSubTitle movieText">${movie.Year}</h4>
								</div>
							</div>
						</div>
					`
				}
			});



			//	Updating "recently released"

			let recent = [];
			data.seen.forEach(item => {
				recent.push(data.movieInfo[item.id]);
			});
			recent = recent.sort((a, b) => {
				return new Date(b.Released).getTime() - new Date(a.Released).getTime();
			});

			let newRecent = [];
			recent.forEach(movie => {
				if(new Date(movie.Released).getTime() - new Date().setHours(0, 0, 0, 0) <= 0) {
					newRecent.push(movie);
				}
			});
			newRecent = newRecent.sort((a, b) => {
				return new Date(b.Released).getTime() - new Date(a.Released).getTime();
			});
			newRecent = [newRecent[0], newRecent[1], newRecent[2]];
			
			newRecent2 = [];
			newRecent.forEach(movie => {
				if(movie) {
					newRecent2.push(movie);
				}
			});
			if(newRecent2.length > 0) {
				document.querySelector(".recentReleasesDiv").innerHTML = '<h2 class="title">Recent releases on your list</h2><div class="recentReleasesMovies"></div>';
				newRecent2.forEach(movie => {
					document.querySelector(".recentReleasesMovies").innerHTML += `
						<div class="inlineMovie" onclick="showMovie('${movie.imdbID}')">
							<div class="inlineMovieLeft">
								<img src="${movie.Poster && movie.Poster !== "N/A" ? movie.Poster : 'assets/poster.png'}" class="poster small">
							</div>
							<div class="inlineMovieRight">
								<div>
									<h3 class="movieTitle movieText">${movie.Title}</h3>
									<h4 class="movieSubTitle movieText">${movie.Released}</h4>
								</div>
							</div>
						</div>
					`
				});
			} else {
				document.querySelector(".recentReleasesDiv").innerHTML = "";
			}



			//	Empty state handling

			if(document.querySelector(".watchlistMoviesList").innerHTML == "") {
				document.querySelector(".watchlistMoviesList").innerHTML = `
					<div class="emptyState">
						<div class="emptyStateContent">
							<h1>No movies on your watchlist!</h1>
							<button class="toSearch" onclick='setTab(["tab", "backupTab"], "search", false); updateNav();'><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--textOnMain, black)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-search"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg> Go add some!</button>
						</div>
					</div>
				`
			}
			if(document.querySelector(".upcomingMoviesList").innerHTML == "") {
				document.querySelector(".upcomingMoviesList").innerHTML = `
					<h2 class="title">Later</h2>
					<div class="emptyState">
						<div class="emptyStateContent">
							<h1>No upcoming movies on your watchlist!</h1>
							<button class="toSearch" onclick='setTab(["tab", "backupTab"], "search", false); updateNav();'><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--textOnMain, black)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-search"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg> Go add some!</button>
						</div>
					</div>
				`
			}
			if(document.querySelector(".recentlyWatched").innerHTML == "") {
				document.querySelector(".recentlyWatchedEmpty").innerHTML = `
					<div class="emptyState">
						<div class="emptyStateContent">
							<h1>You haven't seen any movies yet!</h1>
							<button class="toSearch" onclick='setTab(["tab", "backupTab"], "watchlist", false); updateNav();'><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--textOnMain, black)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-search"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg> Go watch some!</button>
						</div>
					</div>
				`
				document.querySelector(".recentlyWatched").style.height = "0";
			} else {
				document.querySelector(".recentlyWatchedEmpty").innerHTML = "";
				document.querySelector(".recentlyWatched").style.height = "240px";
			}

		} else if(data.status === 404) {
			console.log("User not found");
		} else {
			console.log("Nothing found");
		}
	}).catch(err => {
		alert("Something went wrong!");
		alert(err);
	});
}

function updateWatchlist(newList) {

	watchlist = newList;
	
	document.querySelector(".watchlistMoviesList").innerHTML = "";
	addToWatchlist();
}

function addToWatchlist() {
	loaded = tensLoaded["watchlist"];
	for(let i = (loaded-1) * 10; i < loaded * 10; i++) {
		if(watchlist[i] && movieCache[watchlist[i].id]) {
			movie = movieCache[watchlist[i].id];
			document.querySelector(".watchlistMoviesList").innerHTML += `
				<div class="inlineMovie" onclick="showMovie('${movie.imdbID}')">
					<div class="inlineMovieLeft">
						<img src="${movie.Poster && movie.Poster !== "N/A" ? movie.Poster : 'assets/poster.png'}" class="poster small">
					</div>
					<div class="inlineMovieRight">
						<div>
							<h3 class="movieTitle movieText">${movie.Title}</h3>
							<h4 class="movieSubTitle movieText">${movie.Year}</h4>
						</div>
					</div>
				</div>
			`
		}
	}
	tensLoaded["watchlist"]++
}

function updateUpcoming(newList) {

	upcoming = newList;
	
	document.querySelector(".upcomingMoviesList").innerHTML = "";
	addToUpcoming();
}

function addToUpcoming() {
	
	lastUpcoming = 0;

	loaded = tensLoaded["upcoming"];
	for(let i = (loaded-1) * 10; i < loaded * 10; i++) {
		if(upcoming[i] && movieCache[upcoming[i].id]) {
			movie = movieCache[upcoming[i].id];

			if(lastUpcoming !== upcoming[i].subtitle) {
				if(Number(upcoming[i].subtitle.split(" ")[0]) && !document.querySelector('[data-isLater="true"]')) {
					document.querySelector(".upcomingMoviesList").innerHTML += `<h2 class="title" data-isLater="true">Later</h2>`;
					lastUpcoming = "Later";
				} else if(!document.querySelector('[data-isLater="true"]')) {
					document.querySelector(".upcomingMoviesList").innerHTML += `<h2 class="title${upcoming[i].isToday == true ? " todayTitle" : ""}">${upcoming[i].subtitle}</h2>`;
					lastUpcoming = upcoming[i].subtitle;
				}
			}

			if(!document.querySelector('[data-isLater="true"]')) {
				upcoming[i].subtitle = "";
			}

			document.querySelector(".upcomingMoviesList").innerHTML += `
				<div class="inlineMovie" onclick="showMovie('${movie.imdbID}')">
					<div class="inlineMovieLeft">
						<img src="${movie.Poster && movie.Poster !== "N/A" ? movie.Poster : 'assets/poster.png'}" class="poster small">
					</div>
					<div class="inlineMovieRight">
						<div>
							<h3 class="movieTitle movieText">${movie.Title}</h3>
							<h4 class="movieSubTitle movieText">${upcoming[i].subtitle}</h4>
						</div>
					</div>
				</div>
			`
		}
	}
	tensLoaded["upcoming"]++
}

document.addEventListener("scroll", () => {
	// Adding extra items when needed
	bTab = localStorage.getItem("backupTab");
	if((bTab == "upcoming" || bTab == "watchlist") && isAtBottom()) {
		newObj = {
			"upcoming": addToUpcoming,
			"watchlist": addToWatchlist
		}
		newObj[bTab]();
	}
});

let recentlyWatchedCounter = 0;
let allRecentlyWatched = [];
function updateRecentlyWatched(list) {

	allRecentlyWatched = list;

	document.querySelector(".recentlyWatched").innerHTML = "";
	recentlyWatchedCounter = 0;

	let i = 0;
	for(let nV = 5; nV > 0; nV--) {
		runUpdateRecent();
	}
}

function runUpdateRecent() {
	for(let loop = 0; loop < 10; loop++) {
		if(isAtRecentEnd()) {
			if(allRecentlyWatched[recentlyWatchedCounter]) {
				document.querySelector(".recentlyWatched").innerHTML += `<img onclick="showMovie('${allRecentlyWatched[recentlyWatchedCounter].id}')" class="poster big" src="${movieCache[allRecentlyWatched[recentlyWatchedCounter].id].Poster}">`
			}
			recentlyWatchedCounter++	
		}
			
	}
}

document.querySelector(".recentlyWatched").addEventListener("scroll", () => {
	runUpdateRecent();
});

function isAtBottom() {

		if(window.innerHeight + scrollTop >= document.querySelector(`.${localStorage.getItem("tab")}`).offsetHeight - 200) {
				return true;
		}
		return false;
}

// fetch(`next?q=test&id=tt1706593`);

function showMovie(id) {
	
	document.querySelector(".extrasDiv").innerHTML = "";
	fetch(`${API}extraMovieInfo/?user=${localStorage.getItem("user")}&id=${id}`).then(data => {
		return data.json();
	}).then(data => {
		document.querySelector(".extrasDiv").innerHTML = "";
		Object.keys(data).forEach(item => {
			document.querySelector(".extrasDiv").innerHTML += `<div class="extrasDivBit"><h2>${item}</h2><div class="extrasDivPart">${data[item]}</div></div>`
		});
	});

	document.querySelector(".container.movie").setAttribute("data-imdb-id", id);
	document.querySelector(".movieBanner").style = `background: url("${movieCache[id].Poster && movieCache[id].Poster !== "N/A" ? movieCache[id].Poster : "assets/poster.png"}"); background-size: cover; background-position: center;`;

	document.querySelector(".movieInfoTitle").innerHTML = movieCache[id].Title;
	document.querySelector(".movieInfoDate").innerHTML = movieCache[id].Released;

	document.querySelector(".movieInfoDescription .toEdit").innerHTML = movieCache[id].Plot;

	if(movieCache[id] && movieCache[id].Poster && movieCache[id].Poster !== "N/A") {
		document.querySelector(".posterDiv").innerHTML = `
			<h2>Poster</h2>
			<div class="posterDivImage">
				<img src="${movieCache[id].Poster}" class="poster huge">
			</div>
		` 	
	} else {
		document.querySelector(".posterDiv").innerHTML = "";
	}

	let seen = [];
	user.seen.forEach(item => {
		if(item.id == id) {
			seen = JSON.parse(JSON.stringify(item.watched.dates));
		}
	});

	seen.splice(0, 1);

	newSeen = [];
	seen.forEach(date => {
		date = new Date(date);
		str = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
		
		newDate = moment(str, "YYYYMMDD").fromNow();
		newDate = newDate.split("");
		newDate[0] = newDate[0].toUpperCase();
		newDate = newDate.join("");
		
		newSeen.push([newDate, date.getTime()]);
	});

	newSeen = newSeen.sort((a, b) => {
		return b[1] - a[1];
	});

	if(newSeen.length > 0) {
		document.querySelector(".yourViewingsDiv").innerHTML = "<h2>Your viewings</h2><div class='yourViewingsContent'></div>";
		newSeen.forEach(arr => {
			d = new Date(arr[1]);
			document.querySelector(".yourViewingsContent").innerHTML += `
				<div class="rating spread">
					<div class="ratingLeft">
						<p>${arr[0]}</p>
					</div>
					<div class="ratingRight">
						<div class="miniDate good">
							<p>${pad(d.getDate())}/${pad(d.getMonth())}/${d.getFullYear()}</p>
						</div>
					</div>
				</div>
			`
		});
	} else {
		document.querySelector(".yourViewingsDiv").innerHTML = "";
	}

	document.querySelector(".ratingsDiv").innerHTML = "";
	if(movieCache[id].Ratings && movieCache[id].Ratings.length > 0) {
		document.querySelector(".ratingsDiv").innerHTML = "<h2>Ratings</h2>"
		movieCache[id].Ratings.forEach(rating => {
			rating.Value2 = Number(rating.Value.replace("%", "").replace(".", "").split("/")[0]);
			r = rating.Value2;

			let ratingClass = "";

			if(r <= 55) {
				ratingClass = "horrible";
			} else if(r > 55 && r < 75) {
				ratingClass = "medium";
			} else if(r >= 75) {
				ratingClass = "good";
			}

			document.querySelector(".ratingsDiv").innerHTML += `
				<div class="rating spread">
					<div class="ratingLeft">
						<p>${rating.Source}</p>
					</div>
					<div class="ratingRight">
						<div class="miniRating${" " + ratingClass}">
							<p>${rating.Value2 / 10}</p>
						</div>
					</div>
				</div>
			`
		});
	}

	document.querySelector(".movieInfoViews .toEdit").innerHTML = "This movie is not on your list.";
	document.querySelector(".addRemoveDetailsPos").innerHTML = "Add this movie to your watchlist";
	document.querySelector(".addRemoveDetailsNeg").innerHTML = "";

	if(user) {
		user.seen.forEach(item => {
			if(item.id == id && item.watched.i > 0) {
				document.querySelector(".movieInfoViews .toEdit").innerHTML = `You have seen this movie ${item.watched.i} time(s)`;
				document.querySelector(".addRemoveDetailsPos").innerHTML = "I have just re-watched this movie!";
				document.querySelector(".addRemoveDetailsNeg").innerHTML = "Remove a view from this movie.";
			} else if(item.id == id && item.watched.i == 0) {
				document.querySelector(".movieInfoViews .toEdit").innerHTML = `You have not yet seen this movie`;
				document.querySelector(".addRemoveDetailsPos").innerHTML = "I have just seen this movie!";
				document.querySelector(".addRemoveDetailsNeg").innerHTML = "Remove this movie from my watch-list.";
			}
		});	
	}

	setTab(["tab"], "movie", true);
}
document.addEventListener("scroll", () => {
	runMovieBanner();
});

function runMovieBanner() {
	if(touch.divX && touch.divX >= 50) {
		scrollTop = 0;
	}
 	if(scrollTop <= 0) {
		document.querySelector('.movieBanner').style.height = 300 + scrollTop * -1 + "px";
	}
}

function idOnList(id) {
	isOnList = false;
	user.seen.forEach(item => {
		if(item.id == id) {
			isOnList = true;
		}
	});
	return isOnList;
}

function addView() {
	id = document.querySelector(".movie").getAttribute("data-imdb-id");
	if(new Date(movieCache[id].Released) > new Date() && idOnList(id)) {
		if(confirm("This movie is not out yet. Are you sure you want to add a view?")) {
			fetch(`${API}addView?q=${id}&user=${localStorage.getItem("user")}`).then(() => {
				loadUser();
			});
		}
	} else {
		fetch(`${API}addView?q=${id}&user=${localStorage.getItem("user")}`).then(() => {
			loadUser();
		});
	}
}
function removeView() {
	id = document.querySelector(".movie").getAttribute("data-imdb-id");
	fetch(`${API}removeView?q=${id}&user=${localStorage.getItem("user")}`).then(() => {
		loadUser();
	});
}

function signIn(username, password) {
	fetch(`${API}signIn?name=${username}&pass=${password}`).then(data => {
		return data.json();
	}).then(data => {
		if(data.status == 200) {
			localStorage.setItem("user", data.id);
			location.reload();
		} else {
			document.querySelector(".errorCode").innerHTML = data.message;
		}
	});
}
function newUser(username, password, shouldRun) {
	if(shouldRun) {
		fetch(`${API}newUser?name=${username}&pass=${password}`).then(data => {
			return data.json();
		}).then(data => {
			if(data.status == 200) {
				localStorage.setItem("user", data.id);
				location.reload();
			} else {
				document.querySelector(".errorCodeUp").innerHTML = data.message;
			}
		});	
	} else {
		document.querySelector(".errorCodeUp").innerHTML = "Passwords don't match";
	}	
}

touch = {
	isDoingStuff: false
}

/* I don't know either, okay? */
document.querySelector(".movie").addEventListener("touchstart", evt => {
	touch.startX = evt.touches[0].clientX;
	touch.fromTop = scrollV["movie"];
	document.querySelector('.movieBanner').style.height = 300 + "px";
	document.querySelector(`.${localStorage.getItem("prevTab")}`).style.display = "flex"; 
});

document.querySelector(".movie").addEventListener("touchmove", evt => {
	touch.currentX = evt.touches[0].clientX;
	touch.divX = touch.currentX - touch.startX;
	touch.percentage = touch.divX / (window.innerWidth / 100);
	if(touch.divX >= 50 /* Pixels from the initial touch X. */) {	
		touch.isDoingStuff = true;
		document.querySelector(".movie").style.position = "fixed";
		document.querySelector(".movie").style.top = `calc((52px + env(safe-area-inset-top)) - ${touch.fromTop}px)`;
		document.querySelector(".movie").style.left = `${touch.divX - 50}px`;
	} else {
		endMovieTouch();
		document.querySelector(".movie").style.left = `0`;
		runMovieBanner();
	}
});

document.querySelector(".movie").addEventListener("touchend", evt => {
	endMovieTouch();
	if(touch.percentage > 30/*% of the screen width*/) {
		setTab(["tab", "backupTab"], localStorage.getItem("prevTab"), false);
	} else {
		if(touch.isDoingStuff) {
			window.scrollTo(0, touch.fromTop);	
		}
	}
	document.querySelector(".movie").style.left = `0`;
	document.querySelector(".movie").style.top = `auto`;
	
	touch = {
		isDoingStuff: false
	}
});

function endMovieTouch() {
	runMovieBanner();
	document.querySelector(".movie").style.position = "absolute";
}

function pad(e) {
	e = Number(e);
	if(e <= 9) {
		return "0" + e;
	}
	return e;
}

function newTheme(theme) {
	localStorage.setItem("force-theme", theme);
	document.body.setAttribute("data-theme", theme);
}

function isAtRecentEnd() {
	rs = document.querySelector(".recentlyWatched");
	titleWidth = document.body.scrollWidth;
	return rs.scrollLeft + titleWidth >= rs.scrollWidth - titleWidth;
}