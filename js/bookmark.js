document.addEventListener('DOMContentLoaded', function() {
    const bookmarkList = document.getElementById('bookmark-list');
    const toast = document.getElementById('toast');

    function loadBookmarks() {
        chrome.storage.local.get('bookmarkOrder', function(result) {
            const bookmarkOrder = result.bookmarkOrder || [];
            chrome.bookmarks.getTree(function(bookmarkTreeNodes) {
                bookmarkList.innerHTML = '';
                const bookmarkMap = {};
                processBookmarks(bookmarkTreeNodes, bookmarkMap);
                bookmarkOrder.forEach(id => {
                    if (bookmarkMap[id]) {
                        bookmarkList.appendChild(bookmarkMap[id]);
                    }
                });

                // Append any bookmarks not in the order list (new bookmarks)
                Object.keys(bookmarkMap).forEach(id => {
                    if (!bookmarkOrder.includes(id)) {
                        bookmarkList.appendChild(bookmarkMap[id]);
                    }
                });

                // Check if there's a flag to show the toast
                chrome.storage.local.get('showToast', function(result) {
                    if (result.showToast) {
                        showToast('New bookmark added!');
                        chrome.storage.local.set({ showToast: false });  // Reset the flag
                    }
                });
            });
        });
    }

    function processBookmarks(bookmarkNodes, bookmarkMap) {
        bookmarkNodes.forEach(function(node) {
            if (node.children) {
                processBookmarks(node.children, bookmarkMap);
            } else {
                const listItem = createBookmarkItem(node);
                bookmarkMap[node.id] = listItem;
            }
        });
    }

    function createBookmarkItem(bookmarkNode) {
        const listItem = document.createElement('div');
        const faviconUrl = `https://www.google.com/s2/favicons?domain=${new URL(bookmarkNode.url).hostname}`;
        listItem.classList.add('bookmark-item');
        listItem.draggable = true;
        listItem.dataset.id = bookmarkNode.id;

        listItem.innerHTML = `
            <img src="${faviconUrl}" class="favicon" alt="favicon">
            <span class="bookmark-title">${bookmarkNode.title}</span>
            <div class="more-options">&#8942;</div>
            <div class="dropdown-menu">
                <button class="move-to-top">Move to Top</button>
                <button class="remove-bookmark">Remove</button>
            </div>
        `;

        // Handle click to open the URL
        listItem.addEventListener('click', function() {
            chrome.tabs.create({ url: bookmarkNode.url });
        });

        // Handle drag events
        listItem.addEventListener('dragstart', function() {
            draggedItem = listItem;
            listItem.classList.add('dragging');
            document.body.style.cursor = 'pointer';
        });

        listItem.addEventListener('dragend', function() {
            listItem.classList.remove('dragging');
            document.body.style.cursor = '';
            saveBookmarkOrder();
        });

        // Handle the dropdown menu actions
        listItem.querySelector('.more-options').addEventListener('click', function(event) {
            event.stopPropagation(); // Prevent the event from bubbling up
            const menu = listItem.querySelector('.dropdown-menu');
            menu.classList.toggle('show');
        });

        listItem.querySelector('.dropdown-menu').addEventListener('click', function(event) {
            event.stopPropagation(); // Prevent the event from bubbling up
        });

        listItem.querySelector('.move-to-top').addEventListener('click', function(event) {
            event.stopPropagation(); // Prevent the event from bubbling up
            bookmarkList.prepend(listItem);
            saveBookmarkOrder();
            listItem.querySelector('.dropdown-menu').classList.remove('show'); // Hide the dropdown menu
        });

        listItem.querySelector('.remove-bookmark').addEventListener('click', function(event) {
            event.stopPropagation(); // Prevent the event from bubbling up
            chrome.bookmarks.remove(bookmarkNode.id, function() {
                loadBookmarks();
                showToast('Bookmark removed successfully!');  // Show the toast when a bookmark is removed
            });
            listItem.querySelector('.dropdown-menu').classList.remove('show'); // Hide the dropdown menu
        });

        return listItem;
    }

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.bookmark-item:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    function saveBookmarkOrder() {
        const bookmarkOrder = [...document.querySelectorAll('.bookmark-item')]
            .map(item => item.dataset.id);
        chrome.storage.local.set({ bookmarkOrder: bookmarkOrder });
    }

    function showToast(message) {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    bookmarkList.addEventListener('dragover', (event) => {
        event.preventDefault();
        const afterElement = getDragAfterElement(bookmarkList, event.clientY);
        const dragging = document.querySelector('.dragging');
        if (afterElement == null) {
            bookmarkList.appendChild(dragging);
        } else {
            bookmarkList.insertBefore(dragging, afterElement);
        }
    });

    // Click outside to close the dropdown menu
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.dropdown-menu') && !event.target.closest('.more-options')) {
            document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
                menu.classList.remove('show');
            });
        }
    });

    loadBookmarks();
});
