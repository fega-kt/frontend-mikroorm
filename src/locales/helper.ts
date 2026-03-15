/**
 * 通用的语言模块映射类型，表示可以嵌套的对象结构
 */
interface LanguageModule<T> {
	[key: string]: T | any
}

/**
 * 语言文件的参数类型，用于描述导入的语言文件集合
 */
type LanguageFileMap = Record<string, LanguageModule<LanguageFileMap>>;

export enum LanguageType {
	zh = "zh-CN",
	en = "en-US",
	vi = "vi-VN",

}
export function getLanguage(type: LanguageType) {
	const modules = {
		[LanguageType.zh]: import.meta.glob<LanguageFileMap>("./zh-CN/**/*.json", {
			import: "default",
			eager: true,
		}),
		[LanguageType.en]: import.meta.glob<LanguageFileMap>("./en-US/**/*.json", {
			import: "default",
			eager: true,
		}),
		[LanguageType.vi]: import.meta.glob<LanguageFileMap>("./vi-VN/**/*.json", {
			import: "default",
			eager: true,
		}),
	};

	const langFiles = modules[type];

	return organizeLanguageFiles(langFiles);
}

export function organizeLanguageFiles(files: LanguageFileMap) {
	const result: LanguageModule<LanguageFileMap> = {};

	for (const key in files) {
		const data = files[key];
		const fileArr = key?.split("/");
		const fileName = fileArr[fileArr?.length - 1];
		if (!fileName)
			continue;
		const name = fileName.split(".json")[0];
		if (name)
			result[name] = data;
	}

	return result;
}
