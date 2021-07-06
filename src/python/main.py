#codeing:utf-8
# -*- coding: utf-8 -*-

import os, sys, time
import cv2 as cv
from PIL import Image
import numpy as np
np.set_printoptions(threshold=np.inf)
import pandas as pd
import math
import cmath
import matplotlib.pyplot as plt
import glob
from statistics import mean, stdev
import seaborn as sns
import csv
import collections as cl
import copy
import color_analysis as ca



#ノートパソコンで研究するとき

#path = "D:\Sotsuken\webapp\public\sample\\*"
#anken_path = "D:\Sotsuken\\webapp\\public\\input\\*"

#node.jsからデータをもらって実行
#path = sys.stdin.readline()
#path = path[:-1]
#anken_path = sys.stdin.readline()
#anken_path = anken_path[:-1]
#print(anken_path)

N = 1000

thresh = 1.0E-10
id = 0

#
#画像処理
#
#

def edge_detection(img):
	tmp_img = cv.cvtColor(img, cv.COLOR_BGR2GRAY)#グレースケールに変換
	tmp_img = cv.GaussianBlur(tmp_img, (5, 5), 3)#ガウシアンフィルタ
	tmp_img = cv.GaussianBlur(tmp_img, (5, 5), 3)#ガウシアンフィルタ
	tmp_img = cv.bilateralFilter(tmp_img, 15, 20, 20)#バイラテラルフィルタをかける
	tmp_img = cv.GaussianBlur(tmp_img, (5, 5), 3)#ガウシアンフィルタ
	tmp_img = cv.Canny(tmp_img, 50, 110)#エッジ検出
	return tmp_img

def equal_list(lst1, lst2):
    lst = list(str(lst1))
    for element in lst2:
        try:
            lst.remove(element)
        except ValueError:
            break
    else:
        if not lst:
            return True
    return False


def find_gravity_r(img):#HSVカラーモデルから重心を探す
	hsv = cv.cvtColor(img, cv.COLOR_BGR2HSV)
	h = hsv[:, :, 0]#色相(赤の範囲は256段階の200～20と定義するfromhttps://qiita.com/odaman68000/items/ae28cf7bdaf4fa13a65b)
	s = hsv[:, :, 1]
	mask = np.zeros(h.shape, dtype=np.uint8)
	mask[((h < 20) | (h > 200)) & (s > 128)] = 255

	#輪郭を作るうえで塊ごとに配列化する
	contours, _ = cv.findContours(mask, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE)

	rects = []
	for contour in contours:#contourには輪郭をなすピクセルの情報が入っている
		approx = cv.convexHull(contour)#凸凹のある塊を内包する凸上の形状を算出して２Dポリゴンに
		rect = cv.boundingRect(approx)#袋状になったポリゴンがすっぽり入る四角を計算する
		rects.append(np.array(rect))

	#for rect in rects:
	#	cv.rectangle(img, tuple(rect[0:2]), tuple(rect[0:2] + rect[2:4]), (0, 0, 255), thickness=2)
	#	cv.imshow('red', img)

	#最大の四角を見つける
	result_rect = max(rects, key=(lambda x: x[2] * x[3]))

	#cv.rectangle(img, tuple(result_rect[0:2]), tuple(result_rect[0:2] + result_rect[2:4]), (0, 255, 0), thickness=2)
	#print(result_rect)
	#re_img = img[ result_rect[1] : result_rect[1] + result_rect[3], result_rect[0] : result_rect[0] + result_rect[2]]

	x = result_rect[0] + int(round(result_rect[2]/2))
	y = result_rect[1] + int(round(result_rect[3]/2))
	#cv.imshow('re_red', re_img)
	g_point = np.array([x, y])

	return g_point, result_rect

def detect_figure(img):#重心を使って最短辺から最長辺を求める

	global binary_image#2値画像

	flag = ""#切創のようなエッジの取りやすい傷でないときに利用
	g_point, rect = find_gravity_r(img)
	tmp_img = edge_detection(img)

	min = N
	tmp_point = []
	min_point = []
	min_point1 = []
	min_point2 = []
	max_point1 = []
	max_point2 = []
	dir = 0


	#最短辺を求める
	#重心から最も近いエッジを検出
	for i in range(tmp_img.shape[0]):#多分縦方向
		for j in range(tmp_img.shape[1]):#多分横方向

			if(tmp_img[i][j].tolist() == 255):#エッジ（白）ならば
				tmp_point = np.array([j, i])#ベクトルを保存

				dir = np.linalg.norm(g_point - tmp_point)
				if(dir < min):
					min = dir
					min_point1 = tmp_point

	#エッジが見つからないとき（フラグ持たせて余計な処理させないようにしたほうがいいかも）
	if(len(min_point1) == 0):
		#re_img = img[ result_rect[1] : result_rect[1] + result_rect[3], result_rect[0] : result_rect[0] + result_rect[2]]

		#強制的に抽出された傷からすべてを設定します

		if(rect[2] >= rect[3]):#x方向に大きいとき
			long_axi = rect[2]
			short_axi = rect[3]
			max_point1 = np.array([rect[0] ,g_point[1]])
			max_point2 = np.array([rect[0] + rect[2], g_point[1]])
			min_point1 = np.array([g_point[0],rect[1]])
			min_point2 = np.array([g_point[0],rect[1] + rect[3]])

		else:#y方向に大きいとき
			long_axi = rect[3]
			short_axi = rect[2]
			max_point1 = np.array([g_point[0],rect[1]])
			max_point2 = np.array([g_point[0],rect[1] + rect[3]])
			min_point1 = np.array([rect[0] ,g_point[1]])
			min_point2 = np.array([rect[0] + rect[2], g_point[1]])

		flag = "non_openness"

		return max_point1, max_point2, min_point1, min_point2, long_axi, short_axi, flag

	#重心と一番近いエッジのｘ座標が等しいとき
	elif(g_point[0] == min_point1[0]):
		x = g_point[0]

		#cv.drawMarker(img, (min_point1[0], min_point1[1]), (0, 255, 255), markerType=cv.MARKER_TILTED_CROSS, markerSize=5)
		#cv.imshow("min_point",img)

		if(min_point1[1] < g_point[1]):#最短点からみて重心の反対側を探す
			for i in range(tmp_img.shape[0]):
				y = g_point[1] + i

				if(y < 0 or y >= tmp_img.shape[0] - 1):
					contnue
				elif(tmp_img[y][x].tolist() == 255 or tmp_img[y - 1][x].tolist() == 255 or tmp_img[y + 1][x].tolist() == 255):#エッジ（白）ならば,幅は３
					tmp_point = np.array([x, y])#ベクトルを保存
					min_point2 = tmp_point
					break
		else:
			for i in range(tmp_img.shape[0]):
				y = g_point[1] - i

				if(y < 0 or y >= tmp_img.shape[0]-1):
					continue
				elif(tmp_img[y][x].tolist() == 255 or tmp_img[y + 1][x].tolist() == 255 or tmp_img[y - 1][x].tolist() == 255):#エッジ（白）ならば,幅は３
					tmp_point = np.array([x, y])#ベクトルを保存
					min_point2 = tmp_point
					break
		#print(min_point2)
		#cv.drawMarker(img, (min_point2[0], min_point2[1]), (0, 255, 255), markerType=cv.MARKER_TILTED_CROSS, markerSize=15)
		#cv.imshow("min_point",img)

	#最短点から傷の幅を計算y=kx + b
	else:
		k = (g_point[1] - min_point1[1]) / (g_point[0] - min_point1[0])
		b = g_point[1] - k * g_point[0]
		#print("k is "+str(k)+" , b is"+str(b))
		#print(min_point1)
		#print(g_point)

		#cv.drawMarker(img, (min_point1[0], min_point1[1]), (255, 255, 255), markerType=cv.MARKER_TILTED_CROSS, markerSize=5)
		#cv.imshow("min_point",img)

		if(min_point1[0] < g_point[0]):#最短点からみて重心の反対側を探す
			for i in range(tmp_img.shape[0]):
				x = g_point[0] + i
				y = int(k * x + b)

				if(x >= tmp_img.shape[1] - 1):
					continue
				elif(y < 0 or y >= tmp_img.shape[0] - 2):
					continue

				if(tmp_img[y][x].tolist() == 255 or tmp_img[y][x + 1].tolist() == 255 or tmp_img[y][x - 1].tolist() == 255):#エッジ（白）ならば,幅は３
					tmp_point = np.array([x, y])#ベクトルを保存
					min_point2 = tmp_point
					break
		else:
			for i in range(tmp_img.shape[0]):
				x = g_point[0] - i
				y = int(k * x + b)

				if(x >= tmp_img.shape[1] + 1):
					continue
				elif(y < 0 or y >= tmp_img.shape[0] + 2):
					continue
				else:
					if(y >= tmp_img.shape[0]):
						break
					if(tmp_img[y][x].tolist() == 255 or tmp_img[y][x + 1].tolist() == 255 or tmp_img[y][x - 1].tolist() == 255):#エッジ（白）ならば,幅は３
						tmp_point = np.array([x, y])#ベクトルを保存
						min_point2 = tmp_point
						break

	#min_point1と２に最短辺の座標が入ってる
	#最短辺の長さを算出
	if(len(min_point2) == 0):
		short_axi = round(np.linalg.norm(min_point1 - g_point))*2
	elif(len(min_point1) == 0):
		short_axi = round(np.linalg.norm(min_point2 - g_point))*2
	elif(len(min_point2) != 0 and len(min_point1) != 0):
		short_axi = round(np.linalg.norm(min_point1 - min_point2))
	else:
		print("MIN_POINT Error")

	#最長辺を計算
	long_axi = 0
	tmp_point1 = g_point
	tmp_point2 = g_point

	for r in range(179):#tanの発散を防ぐために数値設定
		k = round(math.tan(math.radians(r - 89)),3)
		b = round(g_point[1] - k * g_point[0], 3)
		for i in range(tmp_img.shape[0]- g_point[1]):
				x = g_point[0] + i
				y = int(round(k * x + b))

				if(y < 0 or tmp_img.shape[0] - 2 < y):#幅３なのでその分ｙの範囲が狭まる
					continue
				elif(x < 0 or tmp_img.shape[1] - 1 < x):#幅３なのでその分ｙの範囲が狭まる
					continue

				elif(tmp_img[y][x].tolist() == 255 or tmp_img[y + 1][x].tolist() == 255 or tmp_img[y - 1][x].tolist() == 255):#エッジ（白）ならば,幅は３
					tmp_point1 = np.array([x, y])
					break

		for i in range(g_point[1]):
				x = g_point[0] - i
				y = int(round(k * x + b))
				#print(str(x) +", "+str(y))

				if(y < 0 or tmp_img.shape[0] - 2 <= y):
					continue

				elif(tmp_img[y][x].tolist() == 255 or tmp_img[y + 1][x].tolist() == 255 or tmp_img[y - 1][x].tolist() == 255):#エッジ（白）ならば,幅は３
					tmp_point2 = np.array([x, y])#ベクトルを保存
					break

		if(len(tmp_point1) == 0 or len(tmp_point2) == 0):
			continue

		#min_point1と２に最短辺の座標が入ってる
		#print(str(tmp_point1) +" , "+ str(tmp_point2))
		tmp_point1 = np.array(tmp_point1)
		tmp_point2 = np.array(tmp_point2)

		if(long_axi < round(np.linalg.norm(tmp_point1 - tmp_point2))):
			max_point1 = tmp_point1
			max_point2 = tmp_point2
			long_axi = round(np.linalg.norm(tmp_point1 - tmp_point2))
			#print("long : "+ str(long_axi))

		tmp_point1 = []
		tmp_point2 = []

	#cv.drawMarker(img, (max_point1[0], max_point1[1]), (255, 255, 255), markerType=cv.MARKER_TILTED_CROSS, markerSize=5)
	#cv.drawMarker(img, (max_point2[0], max_point2[1]), (255, 255, 255), markerType=cv.MARKER_TILTED_CROSS, markerSize=5)
	#cv.imshow("points",img)

	return max_point1, max_point2, min_point1, min_point2, long_axi, short_axi, flag

def detect_edge(img):#形を求める
	tmp_img = edge_detection(img)
	img_edge = img
	max_point1, max_point2, min_point1, min_point2, long_axi, short_axi, flag = detect_figure(img)

	g_point = find_gravity_r(img)
	k = (max_point1[1] - max_point2[1])/(max_point1[0] - max_point2[0])
	b = max_point1[1] - k * max_point1[0]
	size = []
	distance = []
	sin_x = []
	sin_y = []

	edge_side1 = []
	edge_side2 = []
	#print(max_point1)
	#print(max_point2)

	if(abs(k) < 1):#傾きが小さく殆ど水平の時　x= g_point[0]）
		for i in range(int(long_axi)):
			x = max_point1[0] - i
			y = int(round(k * x + b))
			tmp_point1 = []
			tmp_point2 = []
			center = np.array([x, y])

			for j in range(int(round(long_axi))):
				x1 = x
				y1 = y + j
				#print(str(x1)+", "+str(y1))
				#cv.drawMarker(img_edge, (x1, y1), (255, 255, 255), markerType=cv.MARKER_TILTED_CROSS, markerSize=5)


				if(y1 < 1 or tmp_img.shape[0] - 1 <= y1):
					continue

				elif(x1 < 1 or tmp_img.shape[1] - 1 <= x1):
					continue

				else:
					if(tmp_img[y1][x1].tolist() == 255 or tmp_img[y1 + 1][x1].tolist() == 255 or tmp_img[y1 - 1][x1].tolist() == 255):#エッジ（白）ならば,幅は３
						tmp_point1 = np.array([x1, y1])#ベクトルを保存
						edge_side1.append(round(np.linalg.norm(tmp_point1 - center),4))
						break
					if(tmp_img[y1][x1].tolist() == 255 or tmp_img[y1][x1 + 1].tolist() == 255 or tmp_img[y1][x1 -1].tolist() == 255):#エッジ（白）ならば,幅は３
						tmp_point1 = np.array([x1, y1])#ベクトルを保存
						edge_side1.append(round(np.linalg.norm(tmp_point1 - center),4))
						break

			for j in range(int(round(long_axi))):
				x1 = x
				y1 = y - j
				#cv.drawMarker(img_edge, (x1, y1), (255, 255, 255), markerType=cv.MARKER_TILTED_CROSS, markerSize=5)
				if(y1 < 1 or tmp_img.shape[0] - 1 <= y1):
					continue

				elif(x1 < 1 or tmp_img.shape[1] - 1 <= x1):
					continue

				else:
					if(tmp_img[y1][x1].tolist() == 255 or tmp_img[y1 + 1][x1].tolist() == 255 or tmp_img[y1 - 1][x1].tolist() == 255):#エッジ（白）ならば,幅は３
						tmp_point2 = np.array([x1, y1])#ベクトルを保存
						edge_side2.append(round(np.linalg.norm(tmp_point2 - center),4))
						break
					if(tmp_img[y1][x1].tolist() == 255 or tmp_img[y1][x1 + 1].tolist() == 255 or tmp_img[y1][x1 -1].tolist() == 255):#エッジ（白）ならば,幅は３
						tmp_point2 = np.array([x1, y1])#ベクトルを保存
						edge_side2.append(round(np.linalg.norm(tmp_point2 - center),4))
						break


			if(len(tmp_point1) != 0 and len(tmp_point2) != 0):
				#print(round(np.linalg.norm(tmp_point1 - tmp_point2)))
				#cv.drawMarker(img_edge, (x, y), (255, 255, 255), markerType=cv.MARKER_TILTED_CROSS, markerSize=5)
				#cv.drawMarker(img_edge, (tmp_point1[0], tmp_point1[1]), (i*15, 255, 25), markerType=cv.MARKER_TILTED_CROSS, markerSize=5)
				#cv.drawMarker(img_edge, (tmp_point2[0], tmp_point2[1]), (i*15, 255, 25), markerType=cv.MARKER_TILTED_CROSS, markerSize=5)
				#cv.drawMarker(img_edge, tuple(max_point1), (0, 0, 255), markerType=cv.MARKER_TILTED_CROSS, markerSize=5)
				#cv.drawMarker(img_edge, tuple(max_point2), (0, 0, 255), markerType=cv.MARKER_TILTED_CROSS, markerSize=5)

				size.append(round(np.linalg.norm(tmp_point1 - tmp_point2), 3))
				distance.append(i)

			elif(tmp_point1 == [] or tmp_point2 == []):
				#print("Skip")
				continue



	elif(1 < abs(k) and max_point1[0] > max_point2[0]):
		for i in range(int(long_axi)):
			x = max_point1[0] - i
			y = int(round(k * x + b))
			c = y + 1 / k / x
			tmp_point1 = []
			tmp_point2 = []
			center = np.array([x, y])

			for j in range(int(round(long_axi))):
				x1 = int(x + j)
				try:
					y1 = int(round(-1 / k * x1 + c))
				except ZeroDivisionError as e:
					continue
				except OverflowError as e:
					continue
				#print(str(x1)+", "+str(y1))
				#cv.drawMarker(img_edge, (x1, y1), (255, 255, 255), markerType=cv.MARKER_TILTED_CROSS, markerSize=5)


				if(y1 < 1 or tmp_img.shape[0] - 1 <= y1):
					continue

				elif(x1 < 1 or tmp_img.shape[1] - 1 <= x1):
					continue

				else:
					if(tmp_img[y1][x1].tolist() == 255 or tmp_img[y1 + 1][x1].tolist() == 255 or tmp_img[y1 - 1][x1].tolist() == 255):#エッジ（白）ならば,幅は３
						tmp_point1 = np.array([x1, y1])#ベクトルを保存
						edge_side1.append(round(np.linalg.norm(tmp_point1 - center),4))
						break
					if(tmp_img[y1][x1].tolist() == 255 or tmp_img[y1][x1 + 1].tolist() == 255 or tmp_img[y1][x1 -1].tolist() == 255):#エッジ（白）ならば,幅は３
						tmp_point1 = np.array([x1, y1])#ベクトルを保存
						edge_side1.append(round(np.linalg.norm(tmp_point1 - center),4))
						break


			for j in range(int(round(long_axi))):
				x1 = int(x - j)
				try:
					y1 = int(round(-1 / k * x1 + c))
				except ZeroDivisionError as e:
					continue
				except OverflowError as e:
					continue
				#cv.drawMarker(img_edge, (x, y), (255, 255, 255), markerType=cv.MARKER_TILTED_CROSS, markerSize=5)
				if(y1 < 1 or tmp_img.shape[0] - 1 <= y1):
					continue

				elif(x1 < 1 or tmp_img.shape[1] - 1 <= x1):
					continue

				else:
					if(tmp_img[y1][x1].tolist() == 255 or tmp_img[y1 + 1][x1].tolist() == 255 or tmp_img[y1 - 1][x1].tolist() == 255):#エッジ（白）ならば,幅は３
						tmp_point2 = np.array([x1, y1])#ベクトルを保存
						edge_side2.append(round(np.linalg.norm(tmp_point2 - center),4))
						break
					if(tmp_img[y1][x1].tolist() == 255 or tmp_img[y1][x1 + 1].tolist() == 255 or tmp_img[y1][x1 -1].tolist() == 255):#エッジ（白）ならば,幅は３
						tmp_point2 = np.array([x1, y1])#ベクトルを保存
						edge_side2.append(round(np.linalg.norm(tmp_point2 - center),4))
						break


			if(tmp_point1 != [] and tmp_point2 != []):
				#print(round(np.linalg.norm(tmp_point1 - tmp_point2)))
				#cv.drawMarker(img_edge, (x, y), (255, 255, 255), markerType=cv.MARKER_TILTED_CROSS, markerSize=5)
				#cv.drawMarker(img_edge, (tmp_point1[0], tmp_point1[1]), (i*15, 255, 25), markerType=cv.MARKER_TILTED_CROSS, markerSize=5)
				#cv.drawMarker(img_edge, (tmp_point2[0], tmp_point2[1]), (i*15, 255, 25), markerType=cv.MARKER_TILTED_CROSS, markerSize=5)
				#cv.drawMarker(img_edge, tuple(max_point1), (0, 0, 255), markerType=cv.MARKER_TILTED_CROSS, markerSize=5)
				#cv.drawMarker(img_edge, tuple(max_point2), (0, 0, 255), markerType=cv.MARKER_TILTED_CROSS, markerSize=5)

				size.append(round(np.linalg.norm(tmp_point1 - tmp_point2), 3))
				distance.append(i)

			elif(tmp_point1 == [] or tmp_point2 == []):
				#print("Skip")
				continue


	elif(1 < abs(k) and max_point1[0] <= max_point2[0]):
		for i in range(int(round(long_axi))):
			x = max_point1[0] + i
			if(((k * x + b) is np.nan) != True):
				continue
			tmp = k * x + b
			y = int(round(k * x + b))
			c = y + 1 / k / x
			tmp_point1 = []
			tmp_point2 = []
			center = np.array([x, y])
			#cv.drawMarker(img, (x, y), (255, 255, 255), markerType=cv.MARKER_TILTED_CROSS, markerSize=5)

			for j in range(int(round(short_axi * 1.5))):
				x1 = int(x + j)
				y1 = int(round(-1 / k * x1 + c))

				if(y1 < 1 or tmp_img.shape[0] - 1<= y1):
					continue

				elif(x1 < 1 or tmp_img.shape[1] - 1 <= x1):
					continue

				else:
					if(tmp_img[y1][x1].tolist() == 255 or tmp_img[y1 + 1][x1].tolist() == 255 or tmp_img[y1 - 1][x1].tolist() == 255):#エッジ（白）ならば,幅は３
						tmp_point1 = np.array([x1, y1])#ベクトルを保存
						edge_side1.append(round(np.linalg.norm(tmp_point1 - center),4))
						break
					if(tmp_img[y1][x1].tolist() == 255 or tmp_img[y1][x1 + 1].tolist() == 255 or tmp_img[y1][x1 -1].tolist() == 255):#エッジ（白）ならば,幅は３
						tmp_point1 = np.array([x1, y1])#ベクトルを保存
						edge_side1.append(round(np.linalg.norm(tmp_point1 - center),4))
						break

			for j in range(int(round(short_axi * 1.5))):
				x1 = int(x - j)

				if(k == 0):continue
				y1 = int(round(-1 / k * x1 + c))

				if(y1 < 1 or tmp_img.shape[0] - 1 <= y1):
					continue

				elif(x1 < 1 or tmp_img.shape[1] - 1 <= x1):
					continue

				else:
					if(tmp_img[y1][x1].tolist() == 255 or tmp_img[y1 + 1][x1].tolist() == 255 or tmp_img[y1 - 1][x1].tolist() == 255):#エッジ（白）ならば,幅は３
						tmp_point2 = np.array([x1, y1])#ベクトルを保存
						edge_side2.append(round(np.linalg.norm(tmp_point2 - center),4))
						break
					if(tmp_img[y1][x1].tolist() == 255 or tmp_img[y1][x1 + 1].tolist() == 255 or tmp_img[y1][x1 -1].tolist() == 255):#エッジ（白）ならば,幅は３
						tmp_point2 = np.array([x1, y1])#ベクトルを保存
						edge_side2.append(round(np.linalg.norm(tmp_point2 - center),4))
						break



			#print(str(tmp_point1) + " , "+ str(tmp_point2))

			if(tmp_point1 != [] and tmp_point2 != []):
				#print(round(np.linalg.norm(tmp_point1 - tmp_point2)))
				#cv.drawMarker(img_edge, (x, y), (255, 255, 255), markerType=cv.MARKER_TILTED_CROSS, markerSize=5)
				#cv.drawMarker(img_edge, max_point1, (0, 0, 255), markerType=cv.MARKER_TILTED_CROSS, markerSize=5)
				#cv.drawMarker(img_edge, max_point2, (0, 0, 255), markerType=cv.MARKER_TILTED_CROSS, markerSize=5)
				#cv.drawMarker(img_edge, (tmp_point1[0], tmp_point1[1]), (i*15, 255, 25), markerType=cv.MARKER_TILTED_CROSS, markerSize=5)
				#cv.drawMarker(img_edge, (tmp_point2[0], tmp_point2[1]), (i*15, 255, 25), markerType=cv.MARKER_TILTED_CROSS, markerSize=5)
				size.append(round(np.linalg.norm(tmp_point1 - tmp_point2), 3))
				distance.append(i)

			elif(tmp_point1 == [] or tmp_point2 == []):
				print("Skip")
				continue


	#print(size)
	#cv.drawMarker(img_edge, (g_point[0], g_point[1]), (0, 255, 0), markerType=cv.MARKER_TILTED_CROSS, markerSize=15)
	#cv.imshow("edge",img_edge)
	#cv.imshow("img",tmp_img)
	return size, distance, short_axi, edge_side1, edge_side2, flag


def oval_judge(img):
	size, distance, short_axi, e1, e2, flag = detect_edge(img)

	if(flag == "non_openness"):#非開放性の時
		return 0

	#傷が円に近いほどsinとの誤差が小さくなる
	sin_x = np.arange(0,distance.index(max(distance))+1, 1)
	sin_y = np.sin(sin_x/(distance.index(max(distance)))*math.pi)*short_axi

	#差分は正規化
	difference = abs((size - sin_y)*(size - sin_y))/short_axi/short_axi
	plt.scatter(distance, size, label="difference", color="red")
	plt.plot(sin_x, sin_y, label="difference", color="green")
	#plt.show()
	difference = sum(difference)/len(difference)#平均
	print("Oval:"+str(round(difference,2)))

	if (difference <= 0.02):
		return 1
	else:
		return 0

def edge_judge(img):#創縁不整と創縁直線を判定
		size, distance, short_axi, edge_side1, edge_side2, flag = detect_edge(img)

		if(flag == "non_openness"):#非開放性の時
			return 1, 0

		edge_irregular = 0
		edge_straight = 0

		#三分割にする
		sp_size1 = list(np.array_split(edge_side1, 3))
		md_size1 = sp_size1[1]

		sp_size2 = list(np.array_split(edge_side2, 3))
		md_size2 = sp_size2[1]


		#標準偏差、平均、偏導関数を計算
		ev1 = stdev(md_size1)
		ave1 = mean(md_size1)
		cv1 = ev1 / ave1#相対的なバラつきを計算

		ev2 = stdev(md_size2)
		ave2 = mean(md_size2)
		cv2 = ev2 / ave2#相対的なバラつきを計算

		#創縁不整,直線を定義
		if(cv1 < 0.1 and cv2 < 0.1):
			edge_straight = 1
		elif(cv1 >= 0.1 and cv2 >= -0.1):
			edge_irregular = 1
		else:
			edge_straight = 1
			edge_irregular = 1
		#print("cv : "+ str(cv))


		return edge_irregular, edge_straight

def sharp_judge(img):
	size, distance, short_axi, e1, e2, flag = detect_edge(img)

	if(flag == "non_openness"):#非開放性の時
		return 0 ,0, 0, 1



	cos_x = np.arange(0,distance.index(max(distance))+1, 1)
	cos_y = np.cos(cos_x/(distance.index(max(distance)))*math.pi)*short_axi

	#傷の幅を3分割にする
	sp_size = list(np.array_split(size, 3))
	sp_distance = list(np.array_split(distance, 3))
	sp_cos_x = list(np.array_split(cos_x, 3))
	sp_cos_y = list(np.array_split(cos_y, 3))


	#差分を計算(fw:前)
	fw_size = np.diff(sp_size[0], n=1)
	fw_distance = [x for x in range(len(fw_size))]
	fw_cos_x = [x for x in range(len(fw_size))]
	fw_cos_y = np.cos(np.array(fw_cos_x)/(distance.index(max(distance)))*math.pi)*short_axi

	#円の増加速度と比較
	fw_result = fw_size / fw_cos_y
	if(len(fw_result) == 0):
		return 0, 0, 1, 0
	fw_result = round(max(fw_result), 3)

	#差分を計算(bw:後)
	bw_size = np.diff(sp_size[2], n=1)
	bw_distance = [x for x in range(len(sp_distance[0])+len(sp_distance[1]), len(distance)-1)]
	bw_cos_x = [x for x in range(len(sp_distance[0])+len(sp_distance[1]), len(distance)-1)]
	bw_cos_y = np.cos(np.array(bw_cos_x)/(distance.index(max(distance)))*math.pi)*short_axi

	#円の増加速度と比較
	bw_result = bw_size / bw_cos_y
	if(len(bw_result) == 0):
		return 0, 0, 1, 0
	bw_result = round(max(bw_result), 3)


	#サイン関数とプロット、近似曲線を表示
	#plt.scatter(distance, size, label="sharp", color="red")
	#plt.plot(cos_x, cos_y, label="cos", color="green")
	#plt.plot(distance, np.poly1d(np.polyfit(distance, size, 2))(distance), label="近似", color="red")
	#cv.imshow("img",img)
	#plt.show()

	if(fw_result < 0.5 and bw_result < 0.5):#どちらの端も0.5未満なら創端鋭利
		return 1, 0, 1, 0

	elif(fw_result >= 0.5 and bw_result >= 0.5):#どちらの端も0.5未満なら創端太
		return 0, 1, 1, 0

	elif((fw_result < 0.5 or bw_result < 0.5) and (fw_result >= 0.5 and bw_result >= 0.5)):#どちらかの端点が太く、もう一方が鋭利
		return 1, 1, 1, 0

	else:
		return 0, 0, 1, 0


def contrast(image, a):#(aはゲイン)
	image = cv.cvtColor(image, cv.COLOR_BGR2GRAY)#グレースケールに変換
	lut = [ np.uint8(255.0 / (1 + math.exp(-a * (i - 128.) / 255.))) for i in range(256)]
	result_image = np.array( [ lut[value] for value in image.flat], dtype=np.uint8 )
	result_image = result_image.reshape(image.shape)
	return result_image


#重心を見つける関数の使いまわし、傷周辺の長方形だけを繰りぬくように改変
def find_wound_COLOR(img):#HSVカラーモデルから重心を探す
	hsv = cv.cvtColor(img, cv.COLOR_BGR2HSV_FULL)
	h = hsv[:, :, 0]#色相(赤の範囲は256段階の200～20と定義するfromhttps://qiita.com/odaman68000/items/ae28cf7bdaf4fa13a65b)
	s = hsv[:, :, 1]
	mask = np.zeros(h.shape, dtype=np.uint8)
	mask[((h < 20) | (h > 200)) & (s > 128)] = 255

	#輪郭を作るうえで塊ごとに配列化する
	contours, _ = cv.findContours(mask, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE)

	rects = []
	for contour in contours:#contourには輪郭をなすピクセルの情報が入っている
		approx = cv.convexHull(contour)#凸凹のある塊を内包する凸上の形状を算出して２Dポリゴンに
		rect = cv.boundingRect(approx)#袋状になったポリゴンがすっぽり入る四角を計算する
		rects.append(np.array(rect))

	#for rect in rects:
	#	cv.rectangle(img, tuple(rect[0:2]), tuple(rect[0:2] + rect[2:4]), (0, 0, 255), thickness=2)
	#	cv.imshow('red', img)

	if(rects == []):
		return img
	#最大の四角を見つける
	result_rect = max(rects, key=(lambda x: x[2] * x[3]))

	#cv.rectangle(img, tuple(result_rect[0:2]), tuple(result_rect[0:2] + result_rect[2:4]), (0, 255, 0), thickness=2)
	#print(result_rect)
	re_img = img[ result_rect[1] : result_rect[1] + result_rect[3], result_rect[0] : result_rect[0] + result_rect[2]]
	x = result_rect[0] + int(round(result_rect[2]/2))
	y = result_rect[1] + int(round(result_rect[3]/2))
	#cv.imshow('re_red', re_img)
	g_point = np.array([x, y])

	return re_img




def judge(id, file):
	img = cv.imread(file, cv.IMREAD_COLOR)
	img_color = np.array(Image.open(file))

	end_sharp = 0
	end_thick = 0
	edge_irregular = 0
	edge_straight = 0
	oval = 0
	openness = 0
	non_openness = 0

	l_fet = 0
	a_fet = 0
	b_fet = 0
	pca1_x = 0
	pca1_y = 0
	pca1_z = 0
	dist = 0

	detect_figure(img)
	detect_edge(img)

	#エッジのイメージを代入
	edge_img = edge_detection(img)

	#創傷端を判定
	end_sharp, end_thick, openness, non_openness = sharp_judge(img)

	#創傷縁を判定
	edge_irregular, edge_straight = edge_judge(img)

	#円度を判定
	oval = oval_judge(img)

	#色の判定
	lab, xyz, dist = ca.Kmeans(img_color)
	l_fet = lab[0]
	a_fet = lab[1]
	b_fet = lab[2]
	pca1_x = xyz[0]
	pca1_y = xyz[1]
	pca1_z = xyz[2]


	#画像データをまとめる(画像は書き出してパスをわたすことにした)
	result_path = '/Users/asayamayume/Desktop/themis/public/result/'
	path1 = './result/original_img/ori_img_' + str(id) + '.jpg'
	path2 = './result/edge_img/edge_img_'+str(id)+'.jpg'

	cv.imwrite(path1, img)
	cv.imwrite(path2, edge_img)

	#今後書き直す
	if(edge_straight == 1):
		edge_irregular = 0

	result = [end_sharp,end_thick,edge_irregular,edge_straight,oval,openness,non_openness, l_fet, a_fet, b_fet, pca1_x, pca1_y, pca1_z, dist]

	print("Results")
	print(result)


	#辞書作成
	data = {'original_img' : path1, 'edge_img':path2}



	return result,data

#データベースの画像データを記録する
def read_img(folder, anken_path):#フォルダを指定して
	global id
	#print("データベースよみこみ！！！！！！！！"+str(id))
	files = glob.glob(folder + "*.jpg")
	results = []
	data_list = []
	print(files)

	for file in files:
		#sharp, oval, pull, push = judge(img)
		if(file == anken_path):
			continue
		print("Start!!!!!!!!!"+str(id))
		#print(file)
		result, data = judge(id, file)
		data_list.append(data)
		results.append(result)
		id += 1


	#データベースの画像データを追記
		#print(data_list)
	with open('/Users/asayamayume/Desktop/themis/public/results/output_file/img_infos.csv', 'a') as f:
		writer = csv.DictWriter(f, ['original_img', 'edge_img', 'color_hist_img', 'color'])
		#ヘッダの書き込み
		#writer.writeheader()

		for data in data_list:
			#print(data)
			writer.writerow(data)

	with open('/Users/asayamayume/Desktop/themis/public/results/output_file/img_vec.csv', 'a') as f:
		writer2 = csv.writer(f)
		for row in results:
			writer2.writerow(row)

	return results


#案件の画像データを記録する
def anken_read_img(folder):#フォルダを指定して
	global id
	#print("案件よみこみ！！！！！！！！"+str(id))
	files = glob.glob(folder)
	results = []
	data_list = []

	for file in files:
		print(file)
		#sharp, oval, pull, push = judge(img)
		result, data = judge(id, file)
		data_list.append(data)
		results.append(result)
		id += 1

		#print(data_list)
	with open('/Users/asayamayume/Desktop/themis/public/results/output_file/context_dist/img_infos.csv', 'w') as f:
		writer = csv.DictWriter(f, ['original_img', 'edge_img', 'color_hist_img', 'color'])
		#ヘッダの書き込み
		#writer.writeheader()

		for data in data_list:
			#print(data)
			writer.writerow(data)

	with open('/Users/asayamayume/Desktop/themis/public/results/output_file/context_dist/img_vec.csv', 'w') as f:
		writer2 = csv.writer(f)
		for row in results:
			writer2.writerow(row)

	return results

#
#
#意味の数学モデル
#
#

#閾値
e = -1


def flatten(data):
    for item in data:
        if hasattr(item, '__iter__'):
            for element in flatten(item):
                yield element
        else:
            yield item


def no_context_dist(data):#なんの文脈もないときの距離を計算
	distances = []
	for d1 in data:
		dist = []
		for d2 in data:
			tmp = np.array(d1) - np.array(d2)
			dst = np.linalg.norm(tmp)
			dist.append(dst)
		distances.append(dist)

	#print(distances)
	return distances

def make_semantic_matrix(data_mat):#意味行列を作るためのに作成したセマンティックな行列を入力
	print(data_mat)
	#相関行列の作成
	relation_mat = np.dot(np.array(data_mat).T, np.array(data_mat))
	eig_val, eig_vec = np.linalg.eig(relation_mat)#固有値と固有ベクトルを取得
	#print(eig_val)
	#print(eig_vec)

	U,_ = np.linalg.qr(eig_vec)

	#print(len(U))

	#result_sem_mat =[]
	#for vec in eig_vec:
	#	if(np.linalg.norm(vec) > 0):
	#		#print(vec)
	#		result_sem_mat.append(vec)

	#print("sem")
	#print(len(result_sem_mat))

	return U


#文脈の作成
def make_context(sem_mat, word_list, contex_word, data):
	contex_mat = []
	context_vec_list = []
	count = 0

	for c in contex_word:
		contex_mat = [0] * len(sem_mat[0])
		for word in c:#文脈として選んだ言葉のみ抽出
			#if(word == "color"):#文脈として色を選んだ場合
				#for i in range(100):
					#contex_mat.append(relation_mat[i + 7])
			index = word_list.index(word)
			#print("index : "+str(index))
			contex_mat[index] = 1
			context_vec_list.append(contex_mat)

	return context_vec_list

#意味空間への射影
def sem_projection(sem_mat, data, contex_vec_list):#dataはデータベースにある画像、input_imgは今回のメイン画像
	global thresh#閾値以下の距離は0にする処理のための閾値
	#input_vec = np.matrix(input_img) * np.matrix(sem_contex).T
	#data_vec = np.matrix(data) * np.matrix(sem_contex).T
	data_dis =[]#入力データと各データとの距離を記録する
	#print("input:"+str(input_vec))
	#print("data:"+str(data_vec))
	#count = 0


	#重みｃの計算
	#以下で割る用のベクトルを作成
	div_vec =[]
	max = 0
	for s in sem_mat:
		u = 0
		for c in contex_vec_list:
			u += np.dot(np.array(c) , np.array(s))
		div_vec.append(u)


	for num in div_vec:
		#print(max)
		#print(abs(num))
		if(abs(max) < abs(num)):
			max = num


	#print("div_vec : ")
	#print(max)

	#意味重心ベクトル
	G = []
	tmp_sem = []#sem_matを書き換える
	for s in sem_mat:
		w = 0
		for c in contex_vec_list:
			w += np.dot(np.array(c), np.array(s))
		tmp = s
		if(w < 0):
			tmp = -1 * s
			#print(tmp)
		tmp_sem.append(tmp)
		G.append(w / max)
	#print("Gravity")
	#print(G)

	#すべての文脈語と意味素の内積和をすべての意味素における、すべての文脈語と意味素との内積の和を並べてベクトル化したモノを最大ノルムで割る
	weigth_c = []#各意味素における重みを入れておく箱
	#print(sem_contex)
	#print(contex_vec_list)
	count = 0
	for s in sem_mat:
		w = 0
		for c in contex_vec_list:
			#print(w)
			w += np.dot(np.array(c), np.array(s))

		if(abs(w) < 0.0001):
			w  = 0
		weigth_c.append(w / max)
		count += 1
	#print("weight")
	#print(weigth_c)
	#print("tmp_sem")
	#print(tmp_sem)

	#print(len(weigth_c))
	#print(sem_contex)
	#np.array(input_vec)
	#print(input_vec)
	#距離の計算
	#各（文脈から選抜した）意味素において重みを与えて計算する
	#print(data)
	#print(weigth_c)
	cxy = []
	data_vec=[]
	for d in data:#データをベクトルに変換
		#print(d)
		d_vec=[]
		count = 0
		for s in tmp_sem:
			#print(weigth_c[count])
			count1 = 0
			tmp = 0
			for i in d:#dataの成分が１の時内積を計算
				if(i == 1):
					tmp1 = [0] * (len(sem_mat[0]))
					tmp1[count1] = 1
					#print(tmp1)
					if(np.dot(np.array(tmp1), np.array(s)) < 0):#本当は＜がいい
						count1 += 1
						continue
					tmp += (np.dot(np.array(d), np.array(s)))*weigth_c[count]
				else:
					tmp += (np.dot(np.array(d), np.array(s)))/max

				count1 += 1
			d_vec.append(tmp)
		data_vec.append(d_vec)


	#距離計算
	for d1 in data_vec:
		tmp_cxy = []
		for d2 in data_vec:
			tmp = np.linalg.norm(np.array(d1) - np.array(d2))
			tmp_cxy.append(tmp)
		cxy.append(tmp_cxy)




	return cxy



def mmm_operation(path, anken_path):
	#案件のデータを処理
	input_vec = np.array(anken_read_img(anken_path)).flatten()

	#データベースのデータを処理
	results = read_img(path,anken_path)
	#data_listhは画像のパスまで入っている
	#resultsは単純にベクトルのみ
	#print(data_list)

	#word_listに色追加しなくちゃいけない、、、。
	word_list = ["end_sharp","end_thick","edge_irregular","edge_straight","oval","openness","non_openness","l","a","b","x","y","z","d"]
	#print(results)
	sem_mat = make_semantic_matrix(results)
	#sem_data = cl.OrderedDict()

	#意味空間をｃｓｖで出力
	with open('/Users/asayamayume/Desktop/themis/public/results/output_file/sem_mat.csv', 'w') as f:
		writer = csv.writer(f)
		#writer.writerow(word_list)
		for row in sem_mat:
			writer.writerow(row)

	#まずすべての文脈において距離計算
	#word_list = ["end_sharp","end_thick","edge_irregular","edge_straight","oval","openness","non_openness"]
	contex_word = [["end_sharp","end_thick","edge_irregular","edge_straight","oval","openness","non_openness","l","a","b","x","y","z","d"]]

	#文脈の種類を作成
	contex_list = []
	c_list = ["incision", "contusion", "stab"]#文脈の順番を格納
	stab_contex = [["end_sharp", "edge_straight","oval", "openness"]]
	incision_contex = [["end_sharp", "edge_straight", "openness"]]
	contusion_contex = [["end_thick","edge_irregular","oval","non_openness","l","a","b","x","y","z","d"]]
	#all_contex = contex_word
	contex_list.append(incision_contex)
	contex_list.append(contusion_contex)
	contex_list.append(stab_contex)

	contex_vec_list = make_context(sem_mat, word_list, contex_word, results)

	count = 0
	for contex_word in contex_list:#全てのコンテクストについて距離を計算しdistance_listに格納
		distances_list = []
		distances = []#各画像から画像までの距離

		contex_vec_list = make_context(sem_mat, word_list, contex_word, results)

		#for img_vec in results:#画像毎にdataとの距離計算
		#print(img_vec)
		distances = sem_projection(sem_mat, results, contex_vec_list)
		#distances_list.append(distances)

		#print(distances)

		with open('/Users/asayamayume/Desktop/themis/public/results/output_file/context_dist/'+str(count + 1)+'_'+c_list[count]+'_context.csv', 'w') as f:
			writer = csv.writer(f)
			for d in distances:
				writer.writerow(d)
		count += 1


	with open('/Users/asayamayume/Desktop/themis/public/results/output_file/context_dist/0_no_context.csv', 'w') as f:
		writer = csv.writer(f)
		#writer.writerow(no_context_dist(results))
		for d in no_context_dist(results):
				writer.writerow(d)

	#案件の距離を計算する
	count = 0
	results_anken = copy.copy(results)
	#print("##################################################")
	#print(input_vec)
	results_anken.insert(0,input_vec.tolist())
	for contex_word in contex_list:#全てのコンテクストについて距離を計算しdistance_listに格納
		distances_list = []
		distances = []#各画像から画像までの距離

		#案件のデータをinput_vecとして入力
		contex_vec_list = make_context(sem_mat, word_list, contex_word, results)
		#print(results_anken)

		#for img_vec in results:#画像毎にdataとの距離計算
		#print(img_vec)
		distances = sem_projection(sem_mat, results_anken, contex_vec_list)
		#distances_list.append(distances)

		#print(distances)

		with open('/Users/asayamayume/Desktop/themis/public/results/output_file/context_dist/anken_dist/'+str(count + 1)+'_'+c_list[count]+'_context.csv', 'w') as f:
			writer = csv.writer(f)
			for d in distances:
				writer.writerow(d)
		count += 1

	with open('/Users/asayamayume/Desktop/themis/public/results/output_file/img_vec.csv', 'w') as f:
		writer2 = csv.writer(f)
		for row in results_anken:
			writer2.writerow(row)


	with open('/Users/asayamayume/Desktop/themis/public/results/output_file/context_dist/anken_dist/0_no_context.csv', 'w') as f:
		writer = csv.writer(f)
		#writer.writerow(no_context_dist(results))
		for d in no_context_dist(results_anken):
				writer.writerow(d)

	#文脈毎にcsvで出力


	#print(data_list)


if __name__ == '__main__':

	#意味空間を構成するための画像群（のちのLMMLファイル）が入っているフォルダのパスを渡す
	path = "/Users/asayamayume/Desktop/themis/public/results/original_img/"
	anken_path = "/Users/asayamayume/Desktop/themis/public/results/original_img/ori_img_0.jpg"
	mmm_operation(path, anken_path)
