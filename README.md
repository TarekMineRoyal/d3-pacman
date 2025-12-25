# D3 Pac-Man

A custom recreation of the classic arcade game **Pac-Man**, built entirely from scratch using **D3.js** and modern JavaScript (ES Modules).

## 🎮 Play Live
**[Click here to play the game in your browser](https://tarekmineroyal.github.io/d3-pacman/)**

---

## ✨ Features
* **Classic Gameplay**: Authentic movement, pellet eating, and power pellets.
* **Ghost AI**: Four unique ghost personalities (Blinky, Pinky, Inky, and Clyde) with "Chase" and "Scatter" modes.
* **Dynamic Difficulty**: Implements "Cruise Elroy" speed increases as dots are consumed.
* **Audio System**: Authentic sound effects for waka, sirens, eating ghosts, and death.
* **SVG Rendering**: Crisp, scalable graphics rendered dynamically using D3 data binding.

## 🕹️ Controls
* **Arrow Keys** (⬆️ ⬇️ ⬅️ ➡️): Move Pac-Man
* **Restart Button**: Reload the game board

## 🛠️ How to Run Locally
Since this project uses **ES Modules** (`import`/`export`), it requires a local web server to run (you cannot just open `index.html` directly).

### Option 1: VS Code (Recommended)
1.  Install the **Live Server** extension.
2.  Right-click `index.html` and select **"Open with Live Server"**.

### Option 2: Python
If you have Python installed, run this command in the project folder:
```bash
# Python 3
python -m http.server 8000
