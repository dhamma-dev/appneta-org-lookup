javascript:(function() {
  // Prevent loader from running multiple times
  if (document.getElementById('bml-loader-iframe')) {
    alert('Search bookmarklet is already active.');
    return;
  }

  // The entire core logic of the bookmarklet is stored in this string.
  const coreLogic = `
    (function() {
      const BOOKMARKLET_ID = 'org-lookup-bookmarklet';
      if (window.parent.document.getElementById(BOOKMARKLET_ID)) {
        return;
      }

      const provisionUrl = 'https://provision.pm.appneta.com';
      const signonUrl = 'https://signon.pm.appneta.com';

      async function main() {
        const isAuthenticated = await checkAuthentication();
        createUI(window.parent.document);
        attachEventListeners(isAuthenticated);
      }

      async function checkAuthentication() {
        try {
          const response = await fetch(\\\`\${provisionUrl}/api/v1/organization?name=test\\\`);
          return response.status !== 401;
        } catch (error) {
          return false;
        }
      }

      function triggerLogin() {
        const loginUrl = \\\`\${signonUrl}/signon/login.html?redirectUrl=\${window.parent.location.href}\\\`;
        window.parent.open(loginUrl, '_blank');
      }

      function setCache(key, value) {
        try {
          localStorage.setItem(\\\`bml_\${key}\\\`, JSON.stringify(value));
        } catch (e) {}
      }

      function getCache(key) {
        try {
          const item = localStorage.getItem(\\\`bml_\${key}\\\`);
          return item ? JSON.parse(item) : null;
        } catch (e) {
          return null;
        }
      }

      function searchCache(searchTerm) {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        const orgResults = new Map();
        const userResults = new Map();
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key.startsWith('bml_org_')) {
            const orgs = getCache(key.substring(4));
            if (orgs) {
              orgs.forEach(org => {
                if (
                  org.displayName?.toLowerCase().includes(lowerCaseSearchTerm) ||
                  org.erpAccountId?.toLowerCase().includes(lowerCaseSearchTerm) ||
                  org.supportSiteId?.toLowerCase().includes(lowerCaseSearchTerm)
                ) {
                  orgResults.set(org.orgId, org);
                }
              });
            }
          } else if (key.startsWith('bml_user_')) {
            const users = getCache(key.substring(4));
            if (users) {
              users.forEach(user => {
                if (
                  user.firstName?.toLowerCase().includes(lowerCaseSearchTerm) ||
                  user.lastName?.toLowerCase().includes(lowerCaseSearchTerm) ||
                  user.emailAddress?.toLowerCase().includes(lowerCaseSearchTerm)
                ) {
                  userResults.set(user.emailAddress, user);
                }
              });
            }
          }
        }
        return { orgs: Array.from(orgResults.values()), users: Array.from(userResults.values()) };
      }

      function fetchOrganizations(searchInput, searchType) {
        const queryParams = new URLSearchParams({ [searchType]: searchInput });
        return fetch(\\\`\${provisionUrl}/api/v1/organization?\${queryParams.toString()}\\\`).then(r => r.json());
      }

      function fetchUsers(searchInput) {
        const queryParams = new URLSearchParams({ email: searchInput });
        return fetch(\\\`\${provisionUrl}/api/v1/user?\${queryParams.toString()}\\\`).then(r => r.json());
      }

      async function performSearch(isAuthenticated) {
        const searchInput = window.parent.document.getElementById('bl-searchInput').value.trim();
        if (!searchInput) return;
        if (isAuthenticated) {
          const promises = [fetchOrganizations(searchInput, 'name'), fetchOrganizations(searchInput, 'erpAccountId'), fetchOrganizations(searchInput, 'supportSiteId')];
          Promise.allSettled(promises).then(async (results) => {
            let combined = [];
            results.forEach(res => { if (res.status === 'fulfilled') combined = combined.concat(res.value); });
            await setCache(\\\`org_\${searchInput}\\\`, combined);
            displayResults(combined);
          });
        } else {
          const { orgs } = searchCache(searchInput);
          if (orgs.length > 0) {
            displayResults(orgs);
            window.parent.document.getElementById('bl-cacheMessageContainer').style.display = 'block';
          }
        }
      }

      async function performUserSearch(isAuthenticated) {
        const searchInput = window.parent.document.getElementById('bl-userSearchInput').value.trim();
        if (!searchInput) return;
        if (isAuthenticated) {
          fetchUsers(searchInput).then(async (users) => {
            await setCache(\\\`user_\${searchInput}\\\`, users);
            displayUserResults(users);
          });
        } else {
          const { users } = searchCache(searchInput);
          if (users.length > 0) {
            displayUserResults(users);
            window.parent.document.getElementById('bl-cacheMessageContainer').style.display = 'block';
          }
        }
      }

      function displayResults(organizations) {
        const resultsBody = window.parent.document.getElementById('bl-resultsBody');
        resultsBody.innerHTML = '';
        organizations.forEach(org => {
          const row = resultsBody.insertRow();
          row.innerHTML = \\\`<td class="bl-truncate"><a href="https://\${org.server}/pvc/?st=\${org.orgId}" target="_blank">\${org.displayName}</a></td><td>\${org.orgId}</td><td>\${org.parentId || ''}</td><td>\${org.server}</td><td>\${org.erpAccountId || ''}</td><td>\${org.supportSiteId || ''}</td>\\\`;
        });
        window.parent.document.getElementById('bl-resultsTable').style.display = 'table';
      }

      function displayUserResults(users) {
        const container = window.parent.document.getElementById('bl-userResultsContainer');
        container.innerHTML = '';
        users.forEach(user => {
          const div = window.parent.document.createElement('div');
          div.className = 'bl-user-details';
          const roles = JSON.parse(user.pvUserSetting.roles).join(', ');
          let orgsHtml = '<ul>';
          if (user.memberships) {
            user.memberships.forEach(m => { orgsHtml += \\\`<li>\${m.organization.displayName} (ID: \${m.organization.id})</li>\\\`; });
          }
          orgsHtml += '</ul>';
          div.innerHTML = \\\`<h3>\${user.firstName} \${user.lastName}</h3><p>Email: \${user.emailAddress}</p><p>Active: \${user.active ? 'Yes' : 'No'}</p><p>Roles: \${roles}</p><h4>Organizations:</h4>\${orgsHtml}\\\`;
          container.appendChild(div);
        });
        container.style.display = 'block';
      }

      function createUI(doc) {
        const container = doc.createElement('div');
        container.id = BOOKMARKLET_ID;
        const css = \\\`#\${BOOKMARKLET_ID}{position:fixed;top:20px;right:20px;width:680px;max-height:90vh;overflow-y:auto;background-color:#fff;border:1px solid #ccc;border-radius:8px;z-index:10000;box-shadow:0 5px 15px rgba(0,0,0,.3);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;font-size:14px}#\${BOOKMARKLET_ID} .bl-container{padding:20px}#\${BOOKMARKLET_ID} h1{font-size:20px;margin-top:0;margin-bottom:15px;color:#333}#\${BOOKMARKLET_ID} input[type=text],#\${BOOKMARKLET_ID} input[type=submit]{width:100%;padding:10px;box-sizing:border-box;margin-bottom:12px;border:1px solid #ccc;border-radius:4px;font-size:14px}#\${BOOKMARKLET_ID} input[type=submit]{background-color:#007bff;color:#fff;cursor:pointer;border:none;font-weight:700}#\${BOOKMARKLET_ID} input[type=submit]:hover{background-color:#0056b3}#\${BOOKMARKLET_ID} table{width:100%;border-collapse:collapse;margin-top:15px;font-size:12px;table-layout:fixed}#\${BOOKMARKLET_ID} th,#\${BOOKMARKLET_ID} td{border:1px solid #ddd;padding:8px;text-align:left}#\${BOOKMARKLET_ID} th{background-color:#f2f2f2}#\${BOOKMARKLET_ID} .bl-truncate{max-width:150px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#\${BOOKMARKLET_ID} .bl-user-details{border:1px solid #ddd;padding:10px;margin-bottom:10px;border-radius:4px}#\${BOOKMARKLET_ID} #bl-errorContainer{color:#d9534f;margin-top:10px}#\${BOOKMARKLET_ID} #bl-cacheMessageContainer{color:#5bc0de;margin-top:10px;padding:10px;background-color:#f4f8fa;border-radius:4px}#\${BOOKMARKLET_ID} #bl-close-btn{position:absolute;top:10px;right:15px;background:0 0;border:none;font-size:20px;cursor:pointer;color:#aaa}\\\`;
        const html = \\\`<div class="bl-container"><button id="bl-close-btn" title="Close">&times;</button><h1>Organization & User Search</h1><input type="text" id="bl-searchInput" placeholder="Search by ERP ID, Support Site ID, or Name"><input type="submit" id="bl-searchBtn" value="Search Organizations"><hr style="margin: 15px 0;"><input type="text" id="bl-userSearchInput" placeholder="Search user by email"><input type="submit" id="bl-userSearchBtn" value="Search Users"><div id="bl-errorContainer" style="display:none;"></div><div id="bl-cacheMessageContainer" style="display:none;">Showing cached results. <a href="#" id="bl-loginLink">Log in to refresh</a>.</div><table id="bl-resultsTable" style="display:none;"><thead><tr><th>Display Name</th><th>Org ID</th><th>Parent ID</th><th>Server</th><th>ERP ID</th><th>Support ID</th></tr></thead><tbody id="bl-resultsBody"></tbody></table><div id="bl-userResultsContainer" style="display:none;"></div></div>\\\`;

        const styleElement = doc.createElement('style');
        styleElement.id = \\\`\${BOOKMARKLET_ID}-styles\\\`;
        styleElement.textContent = css;
        doc.head.appendChild(styleElement);

        container.innerHTML = html;
        doc.body.appendChild(container);

        doc.getElementById('bl-close-btn').addEventListener('click', () => {
          container.remove();
          styleElement.remove();
        });
      }

      function attachEventListeners(isAuthenticated) {
        const doc = window.parent.document;
        doc.getElementById('bl-searchBtn').addEventListener('click', () => performSearch(isAuthenticated));
        doc.getElementById('bl-userSearchBtn').addEventListener('click', () => performUserSearch(isAuthenticated));
        doc.getElementById('bl-loginLink').addEventListener('click', (e) => {
          e.preventDefault();
          triggerLogin();
        });
        doc.getElementById('bl-searchInput').focus();
      }

      main();
    })();
  `;

  // Create and configure the iframe
  const iframe = document.createElement('iframe');
  iframe.id = 'bml-loader-iframe';
  iframe.style.display = 'none';

  iframe.onload = function() {
    try {
      const script = iframe.contentDocument.createElement('script');
      script.textContent = coreLogic;
      iframe.contentDocument.body.appendChild(script);
    } catch(e) {
      console.error("Bookmarklet failed to inject script into iframe. This may be due to browser security policies on the target page.", e);
      alert("Bookmarklet failed to load due to page security restrictions.");
      iframe.remove();
    }
  };

  // Set the src to start loading the iframe from the correct origin
  iframe.src = 'https://provision.pm.appneta.com/';
  document.body.appendChild(iframe);

})();
