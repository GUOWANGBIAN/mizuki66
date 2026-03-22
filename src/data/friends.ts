// 友情链接数据配置
// 用于管理友情链接页面的数据

export interface FriendItem {
	id: number;
	title: string;
	imgurl: string;
	desc: string;
	siteurl: string;
	tags: string[];
}

// 友情链接数据
export const friendsData: FriendItem[] = [
	{
		id: 1,
		title: "Astro",
		imgurl: "https://avatars.githubusercontent.com/u/44914786?v=4&s=640",
		desc: "The web framework for content-driven websites",
		siteurl: "https://github.com/withastro/astro",
		tags: ["框架"],
	},
	{
		id: 2,
		title: "Mizuki Docs",
		imgurl: "http://q.qlogo.cn/headimg_dl?dst_uin=3231515355&spec=640&img_type=jpg",
		desc: "Mizuki User Manual",
		siteurl: "https://docs.mizuki.mysqil.com",
		tags: ["博客"],
	},
	{
		id: 3,
		title: "Acofork Blog",
		imgurl: "https://q2.qlogo.cn/headimg_dl?dst_uin=2726730791&spec=0",
		desc: "Protect What You Love.",
		siteurl: "https://2x.nz/",
		tags: ["博客"],
	},
	{
		id: 4,
		title: "雪诺的小博客",
		imgurl: "https://blog.4365754.xyz/favicon.ico",
		desc: "每周分享网络相关知识，解析网络技术。 ✨",
		siteurl: "https://blog.4365754.xyz",
		tags: ["博客"],
	},
];

// 获取所有友情链接数据
export function getFriendsList(): FriendItem[] {
	return friendsData;
}

// 获取随机排序的友情链接数据
export function getShuffledFriendsList(): FriendItem[] {
	const shuffled = [...friendsData];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}
