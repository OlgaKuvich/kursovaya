import { renderApp } from "./index.js";
import { replaceSave } from "./helpers.js";

const personalKey = "olga-kuvichinskaya"; //"prod";
const baseHost = "https://wedev-api.sky.pro";
const postsHost = `${baseHost}/api/v1/${personalKey}/instapro`;

export function getPosts({ token }) {
  return fetch(postsHost, {
    method: "GET",
    headers: {
      Authorization: token,
    },
  })
    .then((response) => {
      if (response.status === 401) {
        throw new Error("Нет авторизации");
      }

      return response.json();
    })
    .then((data) => {
      return data.posts;
    });
}

// https://github.com/GlebkaF/webdev-hw-api/blob/main/pages/api/user/README.md#%D0%B0%D0%B2%D1%82%D0%BE%D1%80%D0%B8%D0%B7%D0%BE%D0%B2%D0%B0%D1%82%D1%8C%D1%81%D1%8F
export function registerUser({ login, password, name, imageUrl }) {
  return fetch(baseHost + "/api/user", {
    method: "POST",
    body: JSON.stringify({
      login,
      password,
      name,
      imageUrl,
    }),
  }).then((response) => {
    if (response.status === 400) {
      throw new Error("Такой пользователь уже существует");
    }
    return response.json();
  });
}

export function loginUser({ login, password }) {
  return fetch(baseHost + "/api/user/login", {
    method: "POST",
    body: JSON.stringify({
      login,
      password,
    }),
  }).then((response) => {
    if (response.status === 400) {
      throw new Error("Неверный логин или пароль");
    }
    return response.json();
  });
}

// Загружает картинку в облако, возвращает url загруженной картинки
export function uploadImage({ file }) {
  const data = new FormData();
  data.append("file", file);

  return fetch(baseHost + "/api/upload/image", {
    method: "POST",
    body: data,
  }).then((response) => {
    return response.json();
  });
}

// console.log("Актуальный список постов:", posts);
let message = null;
if (posts) {
  const getApiPosts = posts.map((postItem) => {
    return {
      postId: postItem.id,
      postImageUrl: postItem.imageUrl,
      postCreatedAt: formatDistance(new Date(postItem.createdAt), new Date(), {
        locale: ru,
      }),
      description: replaceSave(postItem.description),
      userId: postItem.user.id,
      userName: replaceSave(postItem.user.name),
      userLogin: postItem.user.login,
      postImageUserUrl: postItem.user.imageUrl,
      usersLikes: postItem.likes,
      isLiked: postItem.isLiked,
    };
  });
  message = getApiPosts
    .map((postItem, index) => {
      return `
			<li class="post">
			<div class="post-header" data-user-id="${postItem.userId}">
					<img src="${postItem.postImageUserUrl}" class="post-header__user-image">
					<p class="post-header__user-name">${postItem.userName}</p>
			</div>
			<div class="post-image-container">
				<img class="post-image" data-post-id="${postItem.postId}" src="${
        postItem.postImageUrl
      }"  data-index="${index}" >
			</div>
			<div class="post-likes">
				<button data-post-id="${postItem.postId}" data-like="${
        postItem.isLiked ? "true" : ""
      }" data-index="${index}" class="like-button">
					<img src=${
            postItem.isLiked
              ? "./assets/images/like-active.svg"
              : "./assets/images/like-not-active.svg"
          }>
				</button>
				<p class="post-likes-text">
				Нравится: ${
          postItem.usersLikes.length > 0
            ? `${postItem.usersLikes[postItem.usersLikes.length - 1].name} ${
                postItem.usersLikes.length - 1 > 0
                  ? "и ещё " + (postItem.usersLikes.length - 1)
                  : ""
              }`
            : "0"
        }
				</p>
			</div>
			<p class="post-text">
				<span class="user-name">${postItem.userName}</span>
				${postItem.description}
			</p>
			<p class="post-date">
			${postItem.postCreatedAt} назад
			</p>
		</li>`;
    })
    .join("");
} else {
  message = "постов нет";
}

/**
 * TODO: чтобы отформатировать дату создания поста в виде "19 минут назад"
 * можно использовать https://date-fns.org/v2.29.3/docs/formatDistanceToNow
 */

const originHtml = `	
	<div class="page-container">
	<div class="header-container"></div>
	<ul class="posts">
	${message}
	</ul>
</div>`;

appEl.innerHTML = originHtml;

renderHeaderComponent({
  element: document.querySelector(".header-container"),
});

for (let userEl of document.querySelectorAll(".post-header")) {
  userEl.addEventListener("click", () => {
    goToPage(USER_POSTS_PAGE, {
      userId: userEl.dataset.userId,
    });
  });

  likeEventListener({ token: getToken() });
  likeEventListenerOnIMG({ token: getToken() });
}

export function likeEventListener() {
  const likeButtons = document.querySelectorAll(".like-button");

  likeButtons.forEach((likeButton) => {
    likeButton.addEventListener("click", (event) => {
      event.stopPropagation();
      const postId = likeButton.dataset.postId;
      const index = likeButton.dataset.index;

      if (posts[index].isLiked) {
        removeLikePost({ token: getToken(), postId }).then((updatedPost) => {
          posts[index].isLiked = false;
          posts[index].likes = updatedPost.post.likes;
          renderApp();
        });
      } else {
        addLikePost({ token: getToken(), postId }).then((updatedPost) => {
          posts[index].isLiked = true;
          posts[index].likes = updatedPost.post.likes;
          renderApp();
        });
      }
    });
  });
}

export function likeEventListenerOnIMG() {
  const likeButtons = document.querySelectorAll(".post-image");

  likeButtons.forEach((likeButton) => {
    likeButton.addEventListener("dblclick", (event) => {
      event.stopPropagation();
      const postId = likeButton.dataset.postId;
      const index = likeButton.dataset.index;

      if (posts[index].isLiked) {
        removeLikePost({ token: getToken(), postId }).then((updatedPost) => {
          posts[index].isLiked = false;
          posts[index].likes = updatedPost.post.likes;
          renderApp();
        });
      } else {
        addLikePost({ token: getToken(), postId }).then((updatedPost) => {
          posts[index].isLiked = true;
          posts[index].likes = updatedPost.post.likes;
          renderApp();
        });
      }
    });
  });
}
