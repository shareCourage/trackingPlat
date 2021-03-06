import React, { Component } from 'react';
import {Switch, Route, NavLink } from 'react-router-dom'
import Monitor from '../component/monitor/monitor'
import Trace from '../component/trace/trace'
import YJCenter from '../component/yjcenter/yjcenter'
import Bms from './bms/bms.js'
import User from './users/user'
import { Tree, Menu, Icon, Button, message, Layout } from 'antd';
import http from "./server"
import "./home.scss"
import Sensor from './sensor/sensor.js'
import Logo from './../asset/images/logo.jpg'
const { Header, Content, Footer, Sider } = Layout;
const { TreeNode } = Tree;

export default class Home extends Component {
  constructor(props) {
    super(props)
    this.state = {
      collapsed: false,
      current: '/home/user',
      eid: '',
      devid: '',
      treeData: [],
      expandedKeys: [],
      autoExpandParent: true,
      selectedKeys: [],  
      account: {
        login_name: '',
        permission: "00"
      },
      isYjCenter: false
    }
  }

  componentDidMount () {
    this.props.history.listen(()=>{
      if (this.props.history.location.pathname === "/home/user") {
        
      }
    })
    this.setState({
      current: this.props.history.location.pathname
    }, () => {
      this.getToken();
    })
  }
  onCollapse = collapsed => {
    console.log(collapsed);
    this.setState({ collapsed });
  };
  getToken = () => {
    let cookie = document.cookie.split(";");
    let cookieParms = {}
    cookie.forEach(item => {
      let objArr = item.split("=");
      cookieParms[objArr[0].trim()] = objArr[1];
    })
    let access_token = cookieParms.access_token;
    let eidLen = parseInt(access_token.substr(3, 2));
    let eid = access_token.substr(5, eidLen);
    let {isYjCenter} = this.state;
    if (eid == 8888) {
      isYjCenter = true;
      eid = 10000;
    }
    let url =  "/ent/getEntInfoByEid";
    http.get(url, {eid: eid}).then((res) => {
      if (res.data.errcode === 0) {
        let data = res.data.data;
        this.setState({
          eid: String(eid),
          account: data
        }, () => {
          this.getSubAcc(String(eid)).then(res => {
            if (res) {
              this.setState({
                isYjCenter,
                treeData: res,
                expandedKeys: [String(eid)],
                selectedKeys: [String(eid)]
              }, () => {
                this.subpage.init({page: 0});
              })              
            }
          })
        })
        
      } else {
        message.error("获取账户信息失败");
      }
    })
  }
  onLoadData = treeNode =>
  new Promise((resolve) => {
    if (treeNode.props.children) {
      resolve();
      return;
    }
    this.getSubAcc(treeNode.props.eid).then(res => {
      if (res) {
        treeNode.props.dataRef.children = res
        this.setState({
          treeData: [...this.state.treeData],
        }, ()=>{
          resolve();
        });
      }
    });
  });
  updateTreeNode = async(type, eid, newNode) => {
    let { treeData } = this.state;
    const getSubAcc = this.getSubAcc;        
    let searchNode = async(type, arr, eid) => {
      for (let i = 0; i < arr.length; i++) {
        if (arr[i].eid === eid) {
          if (type === 'delete') {
            arr.splice(i, 1);
          } else {
              let children = await getSubAcc(eid);  
              arr[i].isLeaf = false;            
              arr[i].children = children;
              this.setState({
                treeData: treeData,
                expandedKeys: [String(eid)]
              })
          }
          return
        } 
        if (arr[i].children) {
          searchNode(type, arr[i].children, eid)
        }   
      }
    }
    await searchNode(type,treeData, eid);
    if (type === 'delete') {
      this.setState({
        treeData: treeData
      })
    } else {
      
    }


  }
  onExpand = expandedKeys => {
    this.setState({
      expandedKeys,
      autoExpandParent: false,
    });
  };

  onCheck = checkedKeys => {
    this.setState({ checkedKeys });
  };
  loadTree = (keys, obj) => {
    console.log(keys);
    console.log(obj)
  }
  onSelect = (selectedKeys, info) => {
    if (!info.selected) return
    this.setState({ selectedKeys, devid: '' }, () => {
      this.subpage.init({page: 0});
    });    
  };
  renderTreeNodes = data =>
    data.map(item => {
      if (item.children) {
        return (
          <TreeNode title={item.title} key={item.key} dataRef={item}>
            {this.renderTreeNodes(item.children)}
          </TreeNode>
        );
      }
      return <TreeNode key={item.key} {...item} dataRef={item} />;
  });
  getSubAcc = (eid) => {    
    let url =  "/ent/getEntChildrenByEid";
    return http.get(url, {eid: eid}).then(res => {
      if (res.data.errcode === 0) {
        let data = res.data.data;
        let newRecords = [];
        let rootNode = {}
        if (eid === this.state.eid) {
          rootNode = {
            eid: data.eid,
            title: data.text,
            pid: data.pid,
            key: data.eid,
            isLeaf: data.leaf
          }
          
        }
        data.records.forEach(item => {
          newRecords.push({
            eid: item.eid,
            pid: item.pid,
            title: item.text,
            isLeaf: item.leaf,
            key: String(item.eid)
          })
        })
        if (eid === this.state.eid) {
          rootNode.children = newRecords;
          return [rootNode]
        }
        return newRecords
      } else {
        message.error("获取下级用户失败")
      }
    })
  }
  onRef = (name, ref) => {
    this.subpage = ref;
  }
  reloadHomeTree = () => {
    let {eid} = this.state;
    this.getSubAcc(eid).then(res => {
      if (res) {
        this.setState({
          treeData: res,
        }, () => {
          this.subpage.init({page: 0});
        })              
      }
    })
  }
  handleMenuClick = e => {
    this.setState({
      current: e.key,
    });
  }
  toPlayback = (devid) => {
    this.props.history.push({
      pathname: "/playback",
      query: {
        devid: devid
      }
    });
  }
  // 90uuuou
  expandAncestors = async(data) => {
    let { treeData } = this.state;
    let ancestors = data.ancestors;    
    let children = treeData;
    let keys = [];
    for (let j = 0; j < ancestors.length; j++) {
      keys.push(String(ancestors[j].eid));
      for (let i = 0; i < children.length; i++) {
        if (ancestors[j].eid === children[i].eid) {
          if (children[i].children) {
            children = children[i].children;
          } else {
              children[i].children = await this.getSubAcc(children[i].eid);
              children = children[i].children; 
            }
          break;
        }        
      }
    }
    this.setState({
        treeData: treeData,
        expandedKeys: keys,
        selectedKeys: [String(ancestors[ancestors.length - 1].eid)],

    }, () => {
      this.subpage.init({page: data.pageno, imei: data.imei});
    })
  }
  changeRouter = (devid, route, page) => {
    this.setState({
      devid: devid,
      current: "/home/" + route
    }, () => {
      this.props.history.push({
        pathname: "/home/" + route, 
        state: {page: page}
      });
    })
  }
  logout = () => {
    this.props.history.push("/login");
  }
  bmsNoPerm = () => {
    this.props.history.push("/home/user")
  }
  render() {
    return (
      <div className="home">
          <header>
            <img src={"http://" + this.state.account.logo_url}/>
            <span className="btn" onClick={this.logout}>退出登录</span>
            <span className="name">{"登陆账户：" + this.state.account.login_name}</span>
          </header>
   
          <Layout className="">
            <Sider className="tree" collapsible collapsed={this.state.collapsed} collapsedWidth={0} onCollapse={this.onCollapse} trigger={null}>
              <Tree loadData={this.onLoadData} 
                onExpand={this.onExpand}
                expandedKeys={this.state.expandedKeys}
                autoExpandParent={this.state.autoExpandParent}
                onSelect={this.onSelect}
                onLoad={this.loadTree}
                selectedKeys={this.state.selectedKeys}
                onRightClick={this.rightClickNode}>
                  {this.renderTreeNodes(this.state.treeData)}
              </Tree>
            </Sider>
            <Layout>
              <div className="subPage">
                <div className="menu">
                  <Menu onClick={this.handleMenuClick} selectedKeys={[this.state.current]} mode="horizontal">
                    <Menu.Item key="/home/user" style={ !this.state.isYjCenter ? {display: 'inline-block'}: {display: 'none'}}>              
                      <NavLink to="/home/user"><Icon type="team"/>客户管理</NavLink>
                    </Menu.Item>
                    <Menu.Item key="/home/monitor" style={ !this.state.isYjCenter ? {display: 'inline-block'}: {display: 'none'} }>              
                      <NavLink to="/home/monitor"><Icon type="environment" />监控</NavLink>              
                    </Menu.Item>
                    <Menu.Item key="/home/bms" style={(this.state.account.permission.substr(0,1) > 0 && !this.state.isYjCenter) ? {display: 'inline-block'}: {display: 'none'}}>              
                      <NavLink to="/home/bms"><Icon type="api" />电池管理</NavLink>              
                    </Menu.Item>
                    <Menu.Item key="/home/sensor" style={(this.state.account.permission.substr(1,1) > 0 && !this.state.isYjCenter) ? {display: 'inline-block'}: {display: 'none'}}>              
                      <NavLink to="/home/sensor"><Icon type="dashboard" />传感器</NavLink>              
                    </Menu.Item>
                  </Menu>
                </div>  
                  <Switch>
                    <Route exact path="/home">
                        <User addNode={this.addNodeCallback} eid={this.state.selectedKeys[0]} rootAcc={this.state.account} onRef={this.onRef.bind(this)} loadTree={this.updateTreeNode} changeRouter={this.changeRouter} expandAncestors={this.expandAncestors} reloadHomeTree={this.reloadHomeTree} />
                    </Route>
                    <Route path="/home/monitor">
                        <Monitor onRef={this.onRef.bind(this)} eid={this.state.selectedKeys[0]} devid={this.state.devid} toPlayback={this.toPlayback} expandAncestors={this.expandAncestors}/>
                    </Route>
                    <Route path="/home/trace">
                        <Trace/>
                    </Route>
                    <Route path="/home/yjcenter">
                        <YJCenter onRef={this.onRef.bind(this)} eid={this.state.selectedKeys[0]}/>
                    </Route>
                    <Route path="/home/bms">
                        <Bms eid={this.state.selectedKeys[0]} onRef={this.onRef.bind(this)} devid={this.state.devid} permission={Number(this.state.account.bms_permission)} bmsNoPerm={this.bmsNoPerm} />
                    </Route>
                    <Route path="/home/user">
                        <User  reloadHomeTree={this.reloadHomeTree} addNode={this.addNodeCallback} rootAcc={this.state.account} eid={this.state.selectedKeys[0]} onRef={this.onRef.bind(this)} loadTree={this.updateTreeNode} changeRouter={this.changeRouter} expandAncestors={this.expandAncestors} />
                    </Route>
                    <Route path="/home/sensor">
                        <Sensor eid={this.state.selectedKeys[0]} onRef={this.onRef.bind(this)} />
                    </Route>
                  </Switch>
              </div>
            </Layout>
          </Layout>
        </div>
    )
  }
}


