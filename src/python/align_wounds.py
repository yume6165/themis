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
from sklearn.cluster import KMeans
from sklearn import manifold
from mpl_toolkits.mplot3d import Axes3D

def mmm_operation(path, anken_path):
	#案件のデータを処理
	input_vec = np.array(anken_read_img(anken_path)).flatten()

	with open('/Users/asayamayume/Desktop/themis/public/result/output_file/sem_mat.csv', 'w') as f:
		writer = csv.writer(f)
		#writer.writerow(word_list)
		for row in sem_mat:
			writer.writerow(row)

	#まずすべての文脈において距離計算
	#word_list = ["end_sharp","end_thick","edge_irregular","edge_straight","oval","openness","non_openness"]
	contex_word = [["end_sharp","end_thick","edge_irregular","edge_straight","oval","openness","non_openness","L","a","b"]]

	#文脈の種類を作成
	contex_list = []
	c_list = ["stab","incision", "contusion", "all"]#文脈の順番を格納
	stab_contex = [["end_sharp", "edge_straight","oval", "openness"]]
	incision_contex = [["end_sharp", "edge_straight", "openness"]]
	contusion_contex = [["end_thick","edge_irregular","oval","non_openness","L","a","b"]]
	all_contex = contex_word

	contex_list.append(incision_contex)
	contex_list.append(contusion_contex)
	contex_list.append(all_contex)
	contex_list.append(stab_contex)

	contex_vec_list = make_context(sem_mat, word_list, contex_word, results)



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

		with open('/Users/asayamayume/Desktop/themis/public/result/output_file/anken_dist/'+str(count + 1)+'_'+c_list[count]+'_context.csv', 'w') as f:
			writer = csv.writer(f)
			for d in distances:
				writer.writerow(d)
		count += 1

	with open('/Users/asayamayume/Desktop/themis/public/result/output_file/img_vec.csv', 'w') as f:
		writer2 = csv.writer(f)
		for row in results_anken:
			writer2.writerow(row)


	with open('/Users/asayamayume/Desktop/themis/public/result/output_file/anken_dist/0_no_context.csv', 'w') as f:
		writer = csv.writer(f)
		#writer.writerow(no_context_dist(results))
		for d in no_context_dist(results_anken):
				writer.writerow(d)

	#文脈毎にcsvで出力


#入力として距離行列が入力される
def align_wounds(path):
    c_list = ["no",  "incision", "contusion", "stab"]
    D = []

    #空のリストを排除
    data_name=['Wound0','Wound1','Wound2','Wound3','Wound4','Wound5','Wound6','Wound7','Wound8','Wound9']

    div = 1

    for count in range(4):
        if count == 0:
            div = 3
        #elif count == 1:
        #    div = math.sqrt(3)
        #elif count == 2:
        #    div = math.sqrt(5)
        #elif count == 3:
        #    div = math.sqrt(4)
        else:
            div = 1

        with open(path[count]) as f:
            reader = csv.reader(f)
            l = [row for row in reader]
        for i in l:
            if(len(i) == 0):continue
            D.append(i)

        datum = np.loadtxt(path[count],delimiter=",",usecols=range(0,10))
        #print(datum)

######################################################################
        #ごり押しでdatnumを広げる
        for i in range(len(datum)):
            for j in range(len(datum[i])):
                datum[i][j] = round(datum[i][j] * 20 / div,3)
#######################################################################

        with open(path[count]) as f:
            reader = csv.reader(f)
            l = [row for row in reader]

        mds = manifold.MDS(n_components=2, dissimilarity="precomputed", random_state=6)
        pos = mds.fit_transform(datum)
        #print(pos)

        with open('/Users/asayamayume/Desktop/themis/public/results/output_file/anken_mds/'+str(count)+'_'+c_list[count]+'_context.csv', 'w') as f:
            writer = csv.writer(f)
            for d in pos:
                writer.writerow(d)
        count += 1



    #重心ががほとんど原点に来るようになってるから原点から違い順に探索
    #(0,0)空の角度を計算して角度0から順番に並べていく

    #プロットするところ
    plt.scatter(pos[:, 0], pos[:, 1], marker = 'o')
    for x, y, n in zip(pos[:, 0], pos[:, 1], data_name):
        plt.scatter(x ,y, s=100)
        plt.annotate(n, xy=(x, y))
    plt.show()



if __name__ == '__main__':
    #絶対パスじゃないといけないのがよくわからない
    path =['/Users/asayamayume/Desktop/themis/public/results/output_file/anken_dist/0_no_context.csv',
            '/Users/asayamayume/Desktop/themis/public/results/output_file/anken_dist/1_incision_context.csv',
            '/Users/asayamayume/Desktop/themis/public/results/output_file/anken_dist/2_contusion_context.csv',
            '/Users/asayamayume/Desktop/themis/public/results/output_file/anken_dist/3_stab_context.csv']

    align_wounds(path)


    #mmm_operation(path, anken_path)
