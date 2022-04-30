// ==UserScript==
// @name         Krunker Market Quick Sell
// @namespace    http://tampermonkey.net/
// @version      v1.0.0
// @description  Script for faster quick selling!
// @author       DavidAngell
// @iconURL      https://phoenixpwn.com/phoenix.png
// @match        *://krunker.io/social.html?*
// @grant        none
// ==/UserScript==

(() => {
	'use strict';
	const EXCLUDED_RARITIES = ["Legendary", "Relic", "Contraband", "Unobtainable", "NFT", ""].map(e => e.toLowerCase());
	const EXCLUDED_ITEM_NAMES = [].map(e => e.toLowerCase())
	const INCLUDED_ITEM_NAMES = [].map(e => e.toLowerCase());
	
	const GAME_RARITIES = [
		{ name: "uncommon", color: "#b2f252" },
		{ name: "rare", color: "#2196F3" },
		{ name: "epic", color: "#E040FB" },
		{ name: "legendary", color: "#FBC02D" },
		{ name: "relic", color: "#ed4242" },
		{ name: "contraband", color: "#292929" },
		{ name: "unobtainable", color: "#fff53d" },
		{ name: "nft", color: "#f3b8ff" },
	];

	document.addEventListener('keydown', (event) => {
		let onInventoryPage = document.getElementsByClassName("marketCard")[0].id.includes("itemCardinventory");
        if (event.key == "@" && onInventoryPage) {
			function setBannerUI() {
				const bigMenTabs = document.getElementsByClassName("bigMenTab");
				bigMenTabs[0].style.display = "none";
				bigMenTabs[1].style.display = "none";
				bigMenTabs[2].style.display = "none";
				bigMenTabs[3].onclick = () => console.log("disabled");
				bigMenTabs[3].innerHTML = "Krunker Quick Seller"
				bigMenTabs[4].style.display = "none";
				bigMenTabs[5].style.display = "none";
				bigMenTabs[6].style.display = "none";
				bigMenTabs[7].onclick = () => quickSellAllItems();
				bigMenTabs[7].innerHTML = "Sell";
				bigMenTabs[8].style.display = "none";
			} 
			
			setBannerUI();
			updateItemsUI();
        }
    });

	function getItemInfo(itemElm) {
		let itemName = itemElm.innerHTML.split('<')[0].toLowerCase()
		let [itemId, rarityNum] =
			String(itemElm.getElementsByClassName("cardAction")[1].onclick)
				.split("\n")[1]
				.replace("quickSell(", "")
				.replace(")", "")
				.split(",");

		return { name: itemName, id: itemId, rarity: GAME_RARITIES[rarityNum].name, rarityNum: rarityNum }
	}

	function isExcluded(item) {
		return (EXCLUDED_RARITIES.includes(item.rarity) || EXCLUDED_ITEM_NAMES.includes(item.name)) && !INCLUDED_ITEM_NAMES.includes(item.name)
	}

	function includeItem(itemName) {
		while(EXCLUDED_ITEM_NAMES.indexOf(itemName) !== -1) {
			EXCLUDED_ITEM_NAMES.splice(EXCLUDED_ITEM_NAMES.indexOf(itemName), 1)
		}
		
		INCLUDED_ITEM_NAMES.push(itemName);
		updateItemsUI();
	}

	function excludeItem(itemName) {
		while(INCLUDED_ITEM_NAMES.indexOf(itemName) !== -1) {
			INCLUDED_ITEM_NAMES.splice(INCLUDED_ITEM_NAMES.indexOf(itemName), 1)
		}
		
		EXCLUDED_ITEM_NAMES.push(itemName);
		updateItemsUI();
	}

	function updateItemsUI() {
		const itemElms = document.getElementsByClassName("marketCard");

		function setItemColorsAndStuff(itemElm, itemName, color, text, onClick) {
			itemElm.style.color = color;
			itemElm.style.border = "5px solid " + color;

			const itemElmInnerButtons = itemElm.querySelector('.cardActions').getElementsByClassName('cardAction');
			itemElmInnerButtons[0].style.display = "none";
			itemElmInnerButtons[1].style.display = "none";
			itemElmInnerButtons[2].innerHTML = text;
			itemElmInnerButtons[2].onclick = () => onClick(itemName);
		}

		for (let i = 0; i < itemElms.length; i++) {
			const itemElm = itemElms[i];
			try {
				const item = getItemInfo(itemElm);
				const itemElmInnerButtons = itemElm.querySelector('.cardActions').getElementsByClassName('cardAction');
				if (isExcluded(item)) {
					setItemColorsAndStuff(itemElm, item.name, "green", "Excluded", (name) => includeItem(name));
				} else {
					setItemColorsAndStuff(itemElm, item.name, GAME_RARITIES[item.rarityNum].color, "Included", (name) => excludeItem(name));
				}

			} catch (error) {
				setItemColorsAndStuff(itemElm, "Yikes Error", "green", "Unsellable", (name) => console.log("error with item ui"));
				console.log("Rendering error...");
				console.error(error);
			}
		}
	}
	
	async function quickSellAllItems() {
		function itemFinishedSelling(itemName) {
			const timer = (ms) => new Promise(res => setTimeout(res, ms))

			return new Promise(async (res, rej) => {
				for (let i = 0; true; i++) {
					if (i > 200) {
						alert("Failed to quick sell item: " + itemName);
						rej("Failed to quick sell item: " + itemName);
						break;
					}
	
					if (document.getElementById('popupContent').querySelector('div').querySelector('div').className == "lds-ring") {
						await timer(20);
					} else {
						break;
					}
				} 
				
				res();
			});	
		} 

		const itemElms = document.getElementsByClassName("marketCard");
		for (let i = 0; i < itemElms.length; i++) {
			try {
				const itemElm = itemElms[i];
				const item = getItemInfo(itemElm);
				if (!isExcluded(item)) {
					window.quickSell(item.id);
					window.sellConfirmed(item.id, 0, undefined)
					await itemFinishedSelling(item.name);
				}
			} catch (error) {
				console.log("Failed to quick sell item...");
				console.error(error);
			}
		}

		alert("Done selling! Page reload!");
		window.location.reload();
	}
})()